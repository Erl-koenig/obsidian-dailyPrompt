import { App, Modal, TextComponent } from "obsidian";

interface IConfirmationDialogParams {
	cta: string;
	onAccept: (text: string[]) => Promise<void>;
	onCancel?: () => void;
	text: string;
	title: string;
	settings: string[];
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
			const question = settings[i];
			const textEl = contentEl.createEl("div", { text: question });

			const inputContainer = contentEl.createEl("div");

			const input = new TextComponent(inputContainer)
				.setPlaceholder("Your Answer")
				.onChange(() => this.updateAcceptButton());

			input.inputEl.style.width = "100%";

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

	private updateAcceptButton() {
		const allInputs = this.contentEl.querySelectorAll("input");
		const isAllFilled = Array.from(allInputs).every(
			(input: HTMLInputElement) => input.value.trim() !== ""
		);
	
		const acceptBtnEl = this.modalEl.getElementsByClassName(
			"mod-cta"
		)[1] as HTMLButtonElement;
	
		if (isAllFilled) {
			acceptBtnEl.removeAttribute("disabled");
		} else {
			acceptBtnEl.setAttribute("disabled", "true");
		}
	}
	

	private addButtons(cta: string) {
		const buttonContainerEl = this.contentEl.createDiv(
			"modal-button-container"
		);
		const cancelBtnEl = buttonContainerEl.createEl("button", {
			text: "Cancel",
			cls: "mod-cta",
		});

		const acceptBtnEl = buttonContainerEl.createEl("button", {
			cls: "mod-cta",
			text: cta,
			attr: {
				disabled: "true",
			},
		});

		acceptBtnEl.addEventListener("click", async (e) => {
			e.preventDefault();
			const allInputs = this.contentEl.querySelectorAll("input");
			const answers = Array.from(allInputs).map((input) =>
				input.value.trim()
			);
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
