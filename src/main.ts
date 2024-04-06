import moment from "moment";
import {
	Plugin,
	App,
	PluginSettingTab,
	Setting,
	ButtonComponent,
} from "obsidian";
import { ConfirmationModal } from "./modal";
import { updateSection } from "./fileUtils";
import {
	createDailyNote,
	getAllDailyNotes,
	getDailyNote,
} from "obsidian-daily-notes-interface";

interface IReviewSettings {
	questions: string[];
	dailyNotesFolder: string;
	promptSectionHeading: string;
	linePrefix: string;
	includeQuestions: boolean;
	questionStyle: "Bold" | "No style";
}

const DEFAULT_SETTINGS: IReviewSettings = {
	questions: ["Example prompt"],
	dailyNotesFolder: "",
	promptSectionHeading: "## Prompts",
	linePrefix: "",
	includeQuestions: true,
	questionStyle: "Bold",
};

declare global {
	interface Window {
		moment: typeof moment;
	}
}

export default class DailyPromptPlugin extends Plugin {
	settings: IReviewSettings;

	async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
		console.log("Daily Prompt plugin loaded");

		this.addCommand({
			id: "open-prompt",
			name: "Open prompt",
			callback: () => setTimeout(() => this.openPrompt(), 20),
		});

		this.addSettingTab(new DailyPromptSettingsTab(this.app, this));
	}

	onunload() {
		console.log("Daily Prompt Plugin unloaded");
	}

	async openPrompt(): Promise<void> {
		const questions = this.settings.questions
			.map((question: any) => `${question}`)
			.join("\n");
		new ConfirmationModal(this.app, {
			cta: "Accept",
			onAccept: async (answers: string[]) => {
				console.log("Prompt accepted with answers:", answers);
				this.fillDailyNote(answers);
			},
			onCancel: () => {
				console.log("Prompt canceled");
			},
			text: questions,
			title: "Prompt",
			settings: this.settings.questions,
		}).open();
	}

	async fillDailyNote(answers: string[]) {
		const date = moment();
		const dailyNotes = getAllDailyNotes();
		let dailyNote = getDailyNote(date, dailyNotes);

		if (!dailyNote) {
			dailyNote = await createDailyNote(date);
		}

		let resultString = "";
		for (let i = 0; i < this.settings.questions.length; i++) {
			const question = this.settings.questions[i];
			if (this.settings.includeQuestions) {
				if (this.settings.questionStyle === "Bold") {
					resultString += "**" + question + "**\n";
				} else {
					resultString += question + "\n";
				}
			}
			resultString += this.settings.linePrefix + answers[i] + "\n\n";
		}
		await updateSection(
			this.app,
			dailyNote,
			this.settings.promptSectionHeading,
			resultString,
		);
	}
}

class DailyPromptSettingsTab extends PluginSettingTab {
	plugin: DailyPromptPlugin;

	constructor(app: App, plugin: DailyPromptPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;
		const plugin: any = (this as any).plugin;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Daily Prompt" });

		containerEl.createEl("h3", {
			text: "General settings",
		});
		new Setting(containerEl)
			.setName("Prompt section heading")
			.setDesc(
				"Defint the heading to use for the prompts. NOTE: Must be unique for every daily note.",
			)
			.addText((text) =>
				text
					.setPlaceholder("## Prompts")
					.setValue(plugin.settings.promptSectionHeading)
					.onChange((value) => {
						if (value === "") {
							plugin.settings.promptSectionHeading = "## Prompts";
						} else {
							plugin.settings.promptSectionHeading = value;
						}
						plugin.saveData(plugin.settings);
					}),
			);
		new Setting(containerEl)
			.setName("Line prefix")
			.setDesc(
				"Prefix for each new line, include the trailing spaces. Examples: `- ` for lists or `- [ ] ` for tasks.",
			)
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(plugin.settings.linePrefix)
					.onChange((value) => {
						plugin.settings.linePrefix = value;
						plugin.saveData(plugin.settings);
					}),
			);
		new Setting(containerEl)
			.setName("Include Questions")
			.setDesc("Decide if questions will be written to the daily note.")
			.addToggle((toggle) => {
				toggle.setValue(plugin.settings.includeQuestions);
				toggle.onChange((value) => {
					plugin.settings.includeQuestions = value;
					plugin.saveData(plugin.settings);
				});
			});
		new Setting(containerEl)
			.setName("Questions style")
			.setDesc("Decide in what style the questions should be displayed.")
			.addDropdown((dropdown) => {
				dropdown.addOption("Bold", "Bold (**)");
				dropdown.addOption("No style", "No style");
				dropdown
					.setValue(plugin.settings.questionStyle)
					.onChange(async (value) => {
						plugin.settings.questionStyle = value;
						plugin.saveData(plugin.settings);
					});
			});
		containerEl.createEl("h3", {
			text: "Prompts",
		});
		new Setting(containerEl)
			.setName("Prompts")
			.setDesc("Add and edit new prompts here")
			.addButton((button: ButtonComponent) => {
				button.setButtonText("Add prompt").onClick(() => {
					plugin.settings.questions.push("");
					plugin.saveData(plugin.settings);
					this.display();
				});
			});

		for (let i = 0; i < plugin.settings.questions.length; i++) {
			const question = plugin.settings.questions[i];

			new Setting(containerEl)
				.setName("Prompt #" + (i + 1))
				.addText((text) =>
					text.setValue(question).onChange(async (value) => {
						plugin.settings.questions[i] = value;
						plugin.saveData(plugin.settings);
					}),
				);

			/*
			  new Setting(containerEl)
				.setName("Field Type")
				.addDropdown((dropdown) => {
					dropdown.addOption("Text", "Text");
					dropdown.addOption("Number", "Number");
					dropdown.addOption("Boolean", "Boolean");
					dropdown.addOption("Images", "Images");
					dropdown.addOption("JSON", "JSON");

					dropdown
						.setValue(question.fieldType)
						.onChange(async (value) => {
							question.fieldType = value;
							plugin.saveData(plugin.settings);
						});
				}); 
			*/

			const removeButton = containerEl.createEl("button", {
				text: "Remove",
				cls: "mod-cta",
			});
			removeButton.addEventListener("click", () => {
				plugin.settings.questions.splice(i, 1);
				plugin.saveData(plugin.settings);
				this.display();
			});
			containerEl.createEl("br");
			containerEl.createEl("br");
		}
	}
}
