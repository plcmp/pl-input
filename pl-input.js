import { PlElement, html, css } from "polylib";
import { debounce } from "@plcmp/utils";

import "@plcmp/pl-labeled-container";

class PlInput extends PlElement {
    static properties = {
        label: { type: String },
        orientation: { type: String },

        type: { type: String, value: 'text' },
        value: { type: String, observer: '_valueObserver' },
        contentWidth: { type: Number },
        labelWidth: { type: Number },

        title: { type: String },

        placeholder: { type: String, value: '' },

        pattern: { type: String },

        min: { type: Number },
        max: { type: Number },
        step: { type: String },

        readonly: { type: Boolean },
        required: { type: Boolean, observer: '_requiredObserver' },
        invalid: { type: Boolean },

        autocomplete: { type: Boolean, value: false, reflectToAttribute: true },

        disabled: { type: Boolean, reflectToAttribute: true, observer: '_disabledObserver' },
        stretch: { type: Boolean, reflectToAttribute: true },
        hidden: { type: Boolean, reflectToAttribute: true }
    };

    static css = css`
        :host([hidden]) {
            display: none;
        }

        :host {
            min-width: 0;
            flex-shrink: 0;
        }

        :host([stretch]) {
            width: 100%;
            flex-shrink: 1;
        }

        :host([stretch]) pl-labeled-container{
            width: 100%;
        }

        :host([:not(disabled)]:hover) .input-container {
            border: 1px solid var(--pl-primary-dark);
        }

        :host([:not(disabled)]:active) .input-container {
            border: 1px solid var(--pl-primary-base);
        }

        .input-container:focus-within, .input-container.required.invalid:focus-within{
            border: 1px solid var(--pl-primary-base);
        }

        .input-container.invalid {
            border: 1px solid var(--pl-negative-base);
        }

        .input-container.invalid:focus-within {
            border: 1px solid var(--pl-negative-base);
        }

        .input-container.required.invalid {
            border: 1px solid var(--pl-grey-base);
        }

        input {
            color: inherit;
            border: none;
            outline:none;
            height: 100%;
            font: var(--pl-text-font);
            color: var(--pl-text-color);
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            background: transparent;
            min-width: 0px;
            width: 100%;
            padding: 0;
        }

        .input-container {
            display: flex;
            min-height: var(--pl-base-size);
            width: 100%;
            flex-direction: row;
            box-sizing: border-box;
            align-items: center;
            overflow: hidden;
            border: 1px solid var(--pl-grey-base);
            border-radius: var(--pl-border-radius);
            position: relative;
            transition: border .3s ease-in-out;
            background: var(--pl-background-color);
        }

        .input-container::before {
            content: '';
            display: block;
            position: absolute;
            box-sizing: border-box;
            inset-block-start: 0;
            inset-inline-start: 0;
        }

        .prefix {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: transparent;
        }

        :host .prefix ::slotted(*) {
            align-self: center;
            max-height: calc(var(--pl-base-size) - 2px);
        }

        .suffix {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: transparent;
        }

        :host .suffix ::slotted(*) {
            align-self: center;
            max-height: calc(var(--pl-base-size) - 2px);
        }

        .input {
            display: flex;
            box-sizing: border-box;
            flex: 1;
            padding: var(--pl-space-xs);
            min-width: 0px;
            align-items: center;
        }

        .input-container.required::before {
			border-block-start: calc(var(--pl-space-md) / 2) solid var(--pl-attention);
			border-inline-start: calc(var(--pl-space-md) / 2)  solid var(--pl-attention);
			border-inline-end: calc(var(--pl-space-md) / 2) solid transparent;
			border-block-end: calc(var(--pl-space-md) / 2) solid transparent;
        }

        input::-ms-reveal,
        input::-ms-clear {
            display: none;
        }

        ::placeholder {
            color: var(--pl-grey-dark);
        }

        :host([disabled]) .input-container,
        :host([disabled]) .input,
        :host([disabled]) .input input,
        :host([disabled]) ::slotted(*),
        :host([disabled]) ::placeholder {
            color: var(--pl-grey-darkest);
            background: var(--pl-grey-lightest);
            cursor: not-allowed;
            user-select: none;
            --pl-icon-fill-color: var(--pl-grey-darkest);
        }

        :host([disabled]) .prefix, :host([disabled]) .suffix {
            pointer-events: none;
            transition: none;
            user-select: none;
        }

        input[type="range"] {
            border: none;
            height: calc(var(--pl-base-size) / 1.7);
            padding: 0px;
            border-radius: var(--pl-border-radius);
        }

        input[type="color"] {
            border: none;
            height: calc(var(--pl-base-size) / 1.7);
            padding: 0px;
            border-radius: var(--pl-border-radius);
        }
        input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        input[type="color"]::-webkit-color-swatch {
            border: none;
        }
    `;

    static template = html`
        <pl-labeled-container exportparts="label" part="labeled-container" orientation="[[orientation]]" label="[[label]]" label-width="[[labelWidth]]"
            content-width="[[contentWidth]]">
            <slot name="label-prefix" slot="label-prefix"></slot>
            <slot name="label-suffix" slot="label-suffix"></slot>
            <div id="inputContainer" class="input-container" part="input-container">
                <span class="prefix">
                    <slot name="prefix"></slot>
                </span>
                <div class="input">
                    <slot name="input"></slot>
                    <input part="native-input" id="nativeInput" value="[[fixText(value)]]" placeholder="[[placeholder]]" type="[[type]]"
                        title="[[_getTitle(value, title, type)]]" min$="[[min]]" max$="[[max]]" step$="[[step]]"
                        disabled$="[[_toBool(disabled)]]" readonly$="[[_toBool(readonly)]]" on-focus="[[_onFocus]]" on-blur="[[_onBlur]]"
                        on-input="[[_onInput]]" autocomplete$="[[_toAutocomplete(autocomplete)]]">
                </div>
                <span class="suffix">
                    <slot name="suffix"></slot>
                </span>
            </div>
        </pl-labeled-container>
        <slot></slot>
    `;

    connectedCallback() {
        super.connectedCallback();
        this.validators = [];
        this._validationResults = [];
        this.validators.push(this.defaultValidators.bind(this));

        this.validate();
    }

    _toBool(val) {
        return !!val;
    }
    _toAutocomplete(val) {
        return val ? 'on' : 'off';
    }

    _requiredObserver() {
        this.validate();
    }

    _valueObserver(value) {
        this.validate();
    }

    _disabledObserver() {
        this.validate();
        if (this.disabled) {
            this.tabIndex = -1;
        } else {
            this.tabIndex = 0;
        }
    }
    _getTitle(val, title, type) {
        if (type === 'password') {
            return '';
        };

        return title || val || '';
    }

    fixText(t) {
        if (t === undefined || t === null) return '';
        return t;
    }

    _onInput = debounce(() => {
        this.value = this.$.nativeInput.value;
    }, 100);

    _onBlur() {
        if (this.type === 'number') {
            this.value = this.$.nativeInput.value !== '' ? this.$.nativeInput.valueAsNumber : null;
        }
    }

    _onFocus() {
        if (!['number', 'color', 'range'].includes(this.type)) {
            var length = this.value?.toString().length || 0;
            if (this.$.nativeInput.setSelectionRange) {
                this.$.nativeInput.setSelectionRange(length, length);
            }
        }
    }

    async validate() {
        const result = await Promise.all(this.validators.map(x => x(this.value)));
        this._validationResults = result.filter(x => x);

        this.invalid = this._validationResults.length > 0 && !this.disabled
        if (this.invalid && this._validationResults.find(x => x.includes('Значение не может быть пустым'))) {
            this.$.inputContainer.classList.add('required');
        } else {
            this.$.inputContainer.classList.remove('required');
        }

        if (this.invalid) {
            this.$.inputContainer.classList.add('invalid');
        } else {
            this.$.inputContainer.classList.remove('invalid');
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

        if (this.type == 'number' && !Number.isNaN(value)) {
            if (this.min && parseFloat(this.min) > value) {
                messages.push(`Значение превышает минимальное значение равное ${this.min}`);
            }

            if (this.max && parseFloat(this.max) < value) {
                messages.push(`Значение превышает максимальное значение равное ${this.max}`);
            }
        }

        if ((value === '' || value === null || value === undefined) && this.required) {
            messages.push('Значение не может быть пустым');
        }

        return messages.length > 0 ? messages.join(';') : undefined;
    }
}

customElements.define('pl-input', PlInput);