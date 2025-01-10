import {
  BaseMenu,
  BaseMenuPage,
  BaseSlashCommand,
  DefaultEmbed,
  ErrorEmbed
} from "@/framework";
import { container } from "@/index";
import {
  type Deck,
  calculateHandValue,
  drawCard,
  generateBoard,
  generateDeck
} from "@/utilities/BlackjackUtil";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type ColorResolvable,
  type User
} from "discord.js";

type MenuState = {
  interactor: User;
};

type Result = {
  playerValue: number;
  dealerValue: number;
  finishedText: string | null;
};

export class BlackjackSlashCommand extends BaseSlashCommand {
  constructor() {
    super({
      name: "blackjack",
      description: "Play a game of blackjack.",
      category: "general",
      guildPlusUser: true
    });
  }

  execute(interaction: ChatInputCommandInteraction) {
    const deck = generateDeck();

    const menu = new BaseMenu<MenuState>({
      state: {
        interactor: interaction.user
      },
      threshold: 30 * 1000
    });

    menu.setPage(new BlackjackPage(deck));

    return menu.start(interaction);
  }
}

class BlackjackPage extends BaseMenuPage<MenuState> {
  private deck: Deck[];

  private playerHand: Deck[] = [];
  private dealerHand: Deck[] = [];

  private attachment: AttachmentBuilder;

  private gameInProgress = true;
  private overallResult: "win" | "lose" | "tie" | null = null;

  constructor(deck: Deck[]) {
    super();

    this.deck = deck;

    this.playerHand = [drawCard(deck), drawCard(deck)];
    this.dealerHand = [drawCard(deck), drawCard(deck)];
  }

  async render() {
    if (!this.attachment) {
      const initialBoard = await generateBoard({
        playerHand: this.playerHand,
        dealerHand: [this.dealerHand[0], this.dealerBackCard],
        playerName: this.state.interactor.displayName,
        playerImage: this.state.interactor.displayAvatarURL(),
        dealerImage: container.client.user
          ? container.client.user.displayAvatarURL()
          : "https://cdn.discordapp.com/embed/avatars/0.png"
      });
      this.attachment = new AttachmentBuilder(initialBoard, {
        name: "board.png"
      });
    }

    return {
      embeds: [
        new DefaultEmbed()
          .setTitle("Blackjack")
          .setDescription(
            "Use `hit` to draw a card or `stand` to end your turn."
          )
          .setColor(
            // biome-ignore format: <explanation>
            this.overallResult === null
              ? container.settings.getString("colors.primary") as ColorResolvable
              : this.overallResult === "tie" ? "Orange" :
                this.overallResult === "win" ? 
                  container.settings.getString("colors.success") as ColorResolvable:
                  container.settings.getString("colors.error") as ColorResolvable
          )
          .setImage(`attachment://${this.attachment.name}`)
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder()
            .setLabel("Hit")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(
              // biome-ignore format: <explanation>
              !this.gameInProgress ||
              calculateHandValue(this.playerHand) === 21 ||
              calculateHandValue(this.dealerHand) === 21
            )
            .setCustomId("hit"),
          new ButtonBuilder()
            .setLabel("Stand")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!this.gameInProgress)
            .setCustomId("stand")
        )
      ],
      files: [this.attachment]
    };
  }

  async handleButton(interaction: ButtonInteraction) {
    if (!container.client.user) return;

    if (interaction.user.id !== this.state.interactor.id) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed("This component is meant for someone else to execute")
        ],
        ephemeral: true
      });
    }

    if (interaction.customId === "hit") {
      this.playerHand.push(drawCard(this.deck));

      if (calculateHandValue(this.playerHand) > 21) {
        const bustedBoard = await generateBoard({
          playerHand: this.playerHand,
          dealerHand: this.dealerHand,
          playerName: interaction.user.displayName,
          playerImage: interaction.user.displayAvatarURL(),
          dealerImage: container.client.user.displayAvatarURL(),
          finishedText: `Dealer wins\n${interaction.user.displayName} busted`
        });
        this.attachment = new AttachmentBuilder(bustedBoard, {
          name: "board.png"
        });

        this.gameInProgress = false;
        this.overallResult = "lose";

        return interaction.update(await this.render());
      }

      const updatedBoard = await generateBoard({
        playerHand: this.playerHand,
        dealerHand: [this.dealerHand[0], this.dealerBackCard],
        playerName: interaction.user.displayName,
        playerImage: interaction.user.displayAvatarURL(),
        dealerImage: container.client.user.displayAvatarURL()
      });
      this.attachment = new AttachmentBuilder(updatedBoard, {
        name: "board.png"
      });

      return interaction.update(await this.render());
    }

    if (interaction.customId === "stand") {
      while (calculateHandValue(this.dealerHand) < 17) {
        this.dealerHand.push(drawCard(this.deck));
      }

      const result = {
        playerValue: calculateHandValue(this.playerHand),
        dealerValue: calculateHandValue(this.dealerHand),
        finishedText: null,
        overallResult: null
      } as Result;

      if (result.playerValue > 21) {
        result.finishedText = `Dealer wins\n${interaction.user.displayName} busted`;
        this.overallResult = "lose";
      } else if (result.dealerValue > 21) {
        result.finishedText = `Dealer busted\n${interaction.user.displayName} wins`;
        this.overallResult = "win";
      } else if (result.playerValue > result.dealerValue) {
        result.finishedText = `${interaction.user.displayName} wins`;
        this.overallResult = "win";
      } else if (result.playerValue < result.dealerValue) {
        result.finishedText = "Dealer wins";
        this.overallResult = "lose";
      } else {
        result.finishedText = "It's a tie!";
        this.overallResult = "tie";
      }

      const finishedBoard = await generateBoard({
        playerHand: this.playerHand,
        dealerHand: this.dealerHand,
        playerName: interaction.user.displayName,
        playerImage: interaction.user.displayAvatarURL(),
        dealerImage: container.client.user.displayAvatarURL(),
        finishedText: result.finishedText
      });
      this.attachment = new AttachmentBuilder(finishedBoard, {
        name: "board.png"
      });

      this.gameInProgress = false;
      return interaction.update(await this.render());
    }
  }

  get dealerBackCard() {
    return {
      suit: "",
      rank: {
        name: "back",
        value: 0
      },
      image: "backCard.png"
    } as Deck;
  }
}
