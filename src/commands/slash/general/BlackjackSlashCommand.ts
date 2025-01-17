import {
  BaseMenu,
  BaseMenuPage,
  BaseSlashCommand,
  DefaultEmbed,
  ErrorEmbed
} from "@/framework";
import { container } from "@/index";
import {
  type Card,
  calculateHandValue,
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
  MessageFlags,
  type User
} from "discord.js";

type Result = {
  playerValue: number;
  dealerValue: number;
  finishedText: string | null;
};

type BlackjackPageState = {
  interactor: User;
};

export class BlackjackSlashCommand extends BaseSlashCommand {
  private decks: Map<string, Card[]> = new Map();

  constructor() {
    super({
      name: "blackjack",
      description: "Play a game of blackjack.",
      category: "general",
      guildPlusUser: true
    });
  }

  execute(interaction: ChatInputCommandInteraction) {
    const deck = this.decks.get(interaction.user.id) || generateDeck();
    if (!this.decks.has(interaction.user.id)) {
      this.decks.set(interaction.user.id, deck);
    }

    const menu = new BaseMenu<BlackjackPageState>({
      state: {
        interactor: interaction.user
      },
      threshold: 60 * 1000
    });

    menu.setPage(new BlackjackPage(deck));

    return menu.start(interaction);
  }
}

class BlackjackPage extends BaseMenuPage<BlackjackPageState> {
  private deck: Card[];

  private playerHand: Card[] = [];
  private dealerHand: Card[] = [];

  private gameInProgress = true;
  private overallResult: "win" | "lose" | "tie" | "incomplete" = "incomplete";

  private attachment: AttachmentBuilder;

  constructor(deck: Card[]) {
    super();

    this.deck = deck;

    this.playerHand = [this.drawCard(), this.drawCard()];
    this.dealerHand = [this.drawCard(), this.drawCard()];
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
          .setFooter(
            this.overallResult === "incomplete" && this.deck.length
              ? {
                  text: `${this.deck.length} cards remaining in the deck`
                }
              : null
          )
          .setImage(`attachment://${this.attachment.name}`)
          .setColor(
            // biome-ignore format: <explanation>
            this.overallResult === "incomplete"
              ? container.settings.getString("colors.primary") as ColorResolvable
              : this.overallResult === "tie" ? "Orange" :
                this.overallResult === "win" ? 
                  container.settings.getString("colors.success") as ColorResolvable :
                  container.settings.getString("colors.error") as ColorResolvable
          )
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder()
            .setLabel("Hit")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(
              // biome-ignore format: <explanation>
              !this.gameInProgress ||
              calculateHandValue(this.playerHand) === 21
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
        flags: MessageFlags.Ephemeral
      });
    }

    if (interaction.customId === "hit") {
      this.playerHand.push(this.drawCard());

      if (calculateHandValue(this.playerHand) > 21) {
        const bustedBoard = await generateBoard({
          playerHand: this.playerHand,
          dealerHand: this.dealerHand,
          playerName: this.state.interactor.displayName,
          playerImage: this.state.interactor.displayAvatarURL(),
          dealerImage: container.client.user.displayAvatarURL(),
          finishedText: `Dealer wins\n${this.state.interactor.displayName} busted`
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
        playerName: this.state.interactor.displayName,
        playerImage: this.state.interactor.displayAvatarURL(),
        dealerImage: container.client.user.displayAvatarURL()
      });
      this.attachment = new AttachmentBuilder(updatedBoard, {
        name: "board.png"
      });

      return interaction.update(await this.render());
    }

    if (interaction.customId === "stand") {
      while (calculateHandValue(this.dealerHand) < 17) {
        this.dealerHand.push(this.drawCard());
      }

      const result: Result = {
        playerValue: calculateHandValue(this.playerHand),
        dealerValue: calculateHandValue(this.dealerHand),
        finishedText: null
      };

      if (result.playerValue > 21) {
        result.finishedText = `Dealer wins\n${this.state.interactor.displayName} busted`;
        this.overallResult = "lose";
      } else if (result.dealerValue > 21) {
        result.finishedText = `Dealer busted\n${this.state.interactor.displayName} wins`;
        this.overallResult = "win";
      } else if (result.playerValue > result.dealerValue) {
        result.finishedText = `${this.state.interactor.displayName} wins`;
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
        playerName: this.state.interactor.displayName,
        playerImage: this.state.interactor.displayAvatarURL(),
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

  private drawCard() {
    if (!this.deck.length) {
      this.deck.push(...generateDeck());
    }

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return this.deck.pop()!;
  }

  private get dealerBackCard(): Card {
    return {
      suit: "",
      rank: {
        name: "back",
        value: 0
      },
      image: "backCard.png"
    };
  }
}
