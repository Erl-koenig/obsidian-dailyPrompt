import {
	App,
	// DropdownComponent,
	Modal,
	SliderComponent,
	TextComponent,
	TextAreaComponent,
	ToggleComponent,
} from "obsidian";
import { fieldType } from "./types";

interface IConfirmationDialogParams {
	cta: string;
	onAccept: (text: string[]) => Promise<void>;
	onCancel?: () => void;
	text: string;
	title: string;
	questions: [string, fieldType][];
}
export class ConfirmationModal extends Modal {
	private config: IConfirmationDialogParams;
	private accepted: boolean;

	constructor(app: App, config: IConfirmationDialogParams) {
		super(app);
		this.config = config;

		const { cta, text, title, settings } = config;

		this.containerEl.addClass("mod-confirmation");
		this.titleEl.setText(title);

		const contentEl = this.contentEl.createDiv();

		for (let i = 0; i < settings.length; i++) {
			const question = settings[i][0];
			const type = settings[i][1];
			const textEl = contentEl.createEl("div", { text: question });

			const inputContainer = contentEl.createEl("div");
			switch (type) {
				case fieldType.Text:
					new TextComponent(inputContainer).setPlaceholder(
						"Your Answer",
					);
					break;
				case fieldType.Checkbox:
					new ToggleComponent(inputContainer);
					break;
				case fieldType.EmbeddedNoteFile:
				case fieldType.Note:
					new TextComponent(inputContainer).setPlaceholder(
						"Enter the name of the note",
					);
					break;
				case fieldType.TextArea:
					new TextAreaComponent(inputContainer).setPlaceholder(
						"Your answer",
					);
					break;
				// case fieldType.OptionSet:
				// 	new DropdownComponent(inputContainer);
				// 	break;
				case fieldType.Slider: {
					const currentValueElement = document.createElement("input");
					currentValueElement.classList.add("sliderValue");
					currentValueElement.type = "number"; // Change input type to number
					currentValueElement.value = "50"; // Set default value
					currentValueElement.addEventListener("input", (event) => {
						const value = parseInt(event.target.value);
						slider.setValue(value); // Update slider value
					});
					inputContainer.appendChild(currentValueElement);

					const sliderWrapper = document.createElement("div");
					inputContainer.appendChild(sliderWrapper);

					const slider = new SliderComponent(sliderWrapper)
						.setValue(50)
						.onChange((value) => {
							currentValueElement.value = value.toString();
						});

					const sliderInput = sliderWrapper.querySelector(
						"input[type='range']",
					);
					sliderInput.addEventListener("input", (event) => {
						const value = parseInt(event.target.value);
						currentValueElement.value = value.toString();
					});
					break;
				}
				default:
					throw new Error(`Unhandled fieldType: ${fieldType}`);
			}

			contentEl.appendChild(textEl);
			contentEl.appendChild(document.createElement("br"));
			contentEl.appendChild(inputContainer);

			// Add a horizontal line if it's not the last question
			if (i < settings.length - 1) {
				const hr = contentEl.createEl("hr");
				contentEl.appendChild(hr);
			}
		}

		this.addButtons(cta);
	}

	// updateAcceptButton() {
	// 	const allInputs = this.contentEl.querySelectorAll(
	// 		"input:not(.slider), input[type='checkbox'], textarea",
	// 	);
	// 	const isAllFilled = Array.from(allInputs).every(
	// 		(input: HTMLInputElement) => input.value.trim() !== "",
	// 	);
	//
	// 	const acceptBtnEl = this.modalEl.getElementsByClassName(
	// 		"mod-cta",
	// 	)[1] as HTMLButtonElement;
	//
	// 	if (isAllFilled) {
	// 		acceptBtnEl.removeAttribute("disabled");
	// 	} else {
	// 		acceptBtnEl.setAttribute("disabled", "true");
	// 	}
	// }

	private addButtons(cta: string) {
		const buttonContainerEl = this.contentEl.createDiv(
			"modal-button-container",
		);
		const cancelBtnEl = buttonContainerEl.createEl("button", {
			text: "Cancel",
			cls: "mod-cta",
		});

		const acceptBtnEl = buttonContainerEl.createEl("button", {
			cls: "mod-cta",
			text: cta,
		});

		acceptBtnEl.addEventListener("click", async (e) => {
			e.preventDefault();
			const allInputs = this.contentEl.querySelectorAll(
				"input:not(.sliderValue), textarea",
			);
			const answers = Array.from(allInputs).map((input) => {
				let value;
				if (input.type === "checkbox") {
					const parentDiv = input.closest(".checkbox-container");
					// Must check the parent div's class, because the input property doesn't update on change
					if (
						parentDiv &&
						parentDiv.classList.contains("is-enabled")
					) {
						value = "true";
					} else {
						value = "false";
					}
				} else {
					value = input.value.trim();
				}
				return value;
			});

			this.accepted = true;
			this.close();
			this.config.onAccept(answers);
		});

		cancelBtnEl.addEventListener("click", (e) => {
			e.preventDefault();
			this.close();
			this.config.onCancel?.();
		});
	}

	onClose(): void {
		if (!this.accepted) {
			this.config.onCancel?.();
		}
	}
}
