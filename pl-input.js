import { PlElement, html, css } from "polylib";
import { debounce } from "@plcmp/utils";

import "@plcmp/pl-labeled-container";

class PlInput extends PlElement {
    static get properties() {
        return {
            label: { type: String },
            variant: { type: String, variant: 'vertical', reflectToAttribute: true },
            type: { type: String, value: 'text' },
            value: { type: String, observer: '_valueObserver' },
            title: { type: String },

            placeholder: { type: String, value: '' },

            pattern: { type: String },

            min: { type: Number },
            max: { type: Number },
            step: { type: String },

            required: { type: Boolean, observer: '_requiredObserver' },
            invalid: { type: Boolean },

            disabled: { type: Boolean, reflectToAttribute: true },
            stretch: { type: Boolean, reflectToAttribute: true },
            hidden: { type: Boolean, reflectToAttribute: true }
        };
    }

    static get css() {
        return css`
            :host {
                display: flex;
                outline: none;
                width: var(--content-width);
            }

            :host([hidden]) {
                display: none;
            }

            :host([variant=horizontal]) {
                width: calc(var(--label-width) + var(--content-width));
            }

            :host([stretch]) {
                width: 100%;
            }

            :host(:hover) .input-container, :host(:hover) .input-container.required.invalid{
                border: 1px solid var(--primary-dark);
			}

            :host(:active) .input-container, :host(:active) .input-container.required.invalid{
                border: 1px solid var(--primary-base);
			}

			.input-container:focus-within, .input-container.required.invalid:focus-within{
                border: 1px solid var(--primary-base);
			}

			.input-container.invalid {
				border: 1px solid var(--negative-base);
			}

            .input-container.required.invalid{
                border: 1px solid var(--grey-light);
            }

			input {
				background: inherit;
				color: inherit;
				border: none;
                outline:none;
				padding: 0px;
                font-size: 14px;
				width: 100%;
				height: 100%;
                font: var(--font-md);
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
			}

			.input-container {
                display: flex;
				height: 32px;
				width: 100%;
                flex-direction: row;
                box-sizing: border-box;
				overflow: hidden;
				border: 1px solid var(--grey-light);
				border-radius: 4px;
				padding: 0 12px;
                position: relative;
                transition: all .3s ease-in-out;
                background: white;
			}

            .input-container::before {
                content: '';
                display: block;
                position: absolute;
                box-sizing: border-box;
                top: 0;
                left: 0;
            }

            .input-container.required::before {
                border-top: 8px solid var(--attention-light);
                border-left: 8px  solid var(--attention-light);
                border-bottom: 8px solid transparent;
                border-right: 8px solid transparent;
            }

			::placeholder {
				color: var(--grey-dark);
			}

			.prefix {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            :host .prefix ::slotted(*) {
                align-self: center;
				margin-right: 8px;
				margin-left: 0px;
                color: var(--grey-dark);
				width: 16px;
				height: 16px;
            }

			.suffix {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            :host .suffix ::slotted(*) {
                align-self: center;
				margin-right: 0px;
				margin-left: 8px;
                color: var(--grey-dark);
				width: 16px;
				height: 16px;
            }

            :host([disabled]) {
                color: var(--grey-base);
                cursor: not-allowed;
                pointer-events: none;
				user-select: none;
            }

            :host([disabled]) .input-container,
			:host([disabled]) .prefix ::slotted(*),
			:host([disabled]) .suffix ::slotted(*),
			:host([disabled]) ::placeholder {
				color: var(--grey-base);
                background: var(--grey-lightest);
            }

            pl-labeled-container {
                width: inherit;
                position: relative;
            }
    	`;
    }

    _requiredObserver() {
        this.validate();
    }

    static get template() {
        return html`
            <pl-labeled-container variant="[[variant]]" label="[[label]]">
                <slot name="label-prefix" slot="label-prefix"></slot>
                <div class="input-container">
                    <span class="prefix">
                        <slot name="prefix"></slot>
                    </span>
                    <input value="[[fixText(value)]]" placeholder="[[placeholder]]" type="[[type]]"
                        title="[[_getTitle(value, title, type)]]" min$="[[min]]" max$="[[max]]" step$="[[step]]"
                        tabindex$="[[_getTabIndex(disabled)]]" on-focus="[[_onFocus]]" on-input="[[_onInput]]">
                    <span class="suffix">
                        <slot name="suffix"></slot>
                    </span>
                    <slot></slot>
                </div>
                <slot name="label-suffix" slot="label-suffix"></slot>
            </pl-labeled-container>
		`;
    }

    connectedCallback() {
        super.connectedCallback();
        this._nativeInput = this.root.querySelector('input');
        this._inputContainer = this.root.querySelector('.input-container');
        this.validators = [];
        this._validationResults = [];
        this.validators.push(this.defaultValidators.bind(this));

        this.validate();
    }

    _getTitle(val, title, type) {
        if (type === 'password') {
            return '';
        };

        return title || val || '';
    }

    _valueObserver(value) {
        this.validate();
    }
    fixText(t) {
        if (t === undefined || t === null) return '';
        return t;
    }
    _onInput() {
        let debouncer = debounce(() => {
            if (this.type == 'number') {
                this.value = this._nativeInput.value !== '' ? this._nativeInput.valueAsNumber : null;
            } else {
                this.value = this._nativeInput.value;
            }
        }, 50)
        debouncer();
    }

    _onFocus() {
        if (this.type != 'number') {
            var length = this.value?.toString().length || 0;
            this._nativeInput.setSelectionRange(length, length);
        }
    }

    async validate() {
        const result = await Promise.all(this.validators.map(x => x(this.value)));
        this._validationResults = result.filter(x => x);

        if (this._validationResults.find(x => x.includes('Значение не может быть пустым'))) {
            this._inputContainer.classList.add('required');
        } else {
            this._inputContainer.classList.remove('required');
        }

        this.invalid = this._validationResults.length > 0;

        if (this.invalid) {
            this._inputContainer.classList.add('invalid');
        } else {
            this._inputContainer.classList.remove('invalid');
        }

        this.dispatchEvent(new CustomEvent('validation-changed', { bubbles: true, composed: true }))
    }

    defaultValidators(value) {
        let messages = [];

        if (this.pattern && value) {
            if (!value.toString().match(new RegExp(this.pattern))) {
                messages.push(`Значение не соответсвует паттерну: ${this.pattern}`);
            }
        }

        if (this.type == 'number' && !Number.isNaN(value) && value) {
            if (this.min && parseInt(this.min) > value) {
                messages.push(`Значение превышает минимальное значение равное ${this.min}`);
            }

            if (this.max && parseInt(this.max) < value && value) {
                messages.push(`Значение превышает максимальное значение равное ${this.max}`);
            }
        }

        if (!value && this.required) {
            messages.push('Значение не может быть пустым');
        }

        return messages.length > 0 ? messages.join(';') : undefined;
    }

    _getTabIndex(disabled) {
        return disabled ? -1 : 0;
    }
}

customElements.define('pl-input', PlInput);