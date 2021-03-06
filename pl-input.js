import { PlElement, html, css } from "polylib";
import { debounce } from "@plcmp/utils";

import "@plcmp/pl-labeled-container";

class PlInput extends PlElement {
    static properties = {
        label: { type: String },
        variant: { type: String, observer: '_variantObserver' },
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

        disabled: { type: Boolean, reflectToAttribute: true },
        stretch: { type: Boolean, reflectToAttribute: true },
        hidden: { type: Boolean, reflectToAttribute: true }
    };

    static css = css`
        :host([hidden]) {
            display: none;
        }

        :host([stretch]) {
            width: 100%;
        }

        :host([stretch]) pl-labeled-container{
            width: 100%;
        }

        :host(:hover) .input-container {
            border: 1px solid var(--primary-dark);
        }

        :host(:active) .input-container {
            border: 1px solid var(--primary-base);
        }

        .input-container:focus-within, .input-container.required.invalid:focus-within{
            border: 1px solid var(--primary-base);
        }

        .input-container.invalid {
            border: 1px solid var(--negative-base);
        }

        .input-container.invalid:focus-within {
            border: 1px solid var(--negative-base);
        }

        .input-container.required.invalid {
            border: 1px solid var(--grey-base);
        }

        input {
            color: inherit;
            border: none;
            outline:none;
            flex: 1;
            height: 100%;
            font: var(--text-font);
            color: var(--text-color);
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }

        .input-container {
            display: flex;
            min-height: var(--base-size-md);
            width: 100%;
            flex-direction: row;
            box-sizing: border-box;
            align-items: center;
            overflow: hidden;
            border: 1px solid var(--grey-base);
            border-radius: var(--border-radius);
            position: relative;
            transition: all .3s ease-in-out;
            background: var(--background-color);
            gap: 4px;
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
        }

        .input {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            box-sizing: border-box;
            flex: 1;
            padding: 4px 0;
            min-width: 0px;
        }

        .input-container.required::before {
            border-block-start: calc(var(--space-md) / 2) solid var(--attention);
            border-inline-start: calc(var(--space-md) / 2)  solid var(--attention);
            border-inline-end: calc(var(--space-md) / 2) solid transparent;
            border-block-end: calc(var(--space-md) / 2) solid transparent;
        }

        input::-ms-reveal,
        input::-ms-clear {
            display: none;
        }

        ::placeholder {
            color: var(--grey-dark);
        }

        :host([disabled]) {
            color: var(--grey-base);
            cursor: not-allowed;
            pointer-events: none;
            user-select: none;
        }

        :host([disabled]) .input-container,
        :host([disabled]) .input-container input,
        :host([disabled]) ::slotted(*),
        :host([disabled]) ::placeholder {
            color: var(--grey-base);
            background: var(--grey-lightest);
        }
    `;

    static template = html`
        <pl-labeled-container orientation="[[orientation]]" label="[[label]]" label-width="[[labelWidth]]"
            content-width="[[contentWidth]]">
            <slot name="label-prefix" slot="label-prefix"></slot>
            <slot name="label-suffix" slot="label-suffix"></slot>
            <div id="inputContainer" class="input-container">
                <span class="prefix">
                    <slot name="prefix"></slot>
                </span>
                <div class="input">
                    <slot name="input"></slot>
                    <input id="nativeInput" value="[[fixText(value)]]" placeholder="[[placeholder]]" type="[[type]]"
                        title="[[_getTitle(value, title, type)]]" min$="[[min]]" max$="[[max]]" step$="[[step]]"
                        tabindex$="[[_getTabIndex(disabled)]]" readonly$="[[readonly]]" on-focus="[[_onFocus]]"
                        on-input="[[_onInput]]">
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
        this._nativeInput = this.$.nativeInput;
        this._inputContainer = this.$.inputContainer;
        this.validators = [];
        this._validationResults = [];
        this.validators.push(this.defaultValidators.bind(this));

        this.validate();

        if (this.variant) {
            console.log('Variant is deprecated, use orientation instead');
            this.orientation = this.variant;
        }
    }

    _requiredObserver() {
        this.validate();
    }

    _valueObserver(value) {
        this.validate();
    }

    _variantObserver(val) {
        if (val) {
            console.log('variant is deprecated, use orientation instead');
            this.orientation = val;
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

        if (this._validationResults.find(x => x.includes('???????????????? ???? ?????????? ???????? ????????????'))) {
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
                messages.push(`???????????????? ???? ???????????????????????? ????????????????: ${this.pattern}`);
            }
        }

        if (this.type == 'number' && !Number.isNaN(value) && value) {
            if (this.min && parseInt(this.min) > value) {
                messages.push(`???????????????? ?????????????????? ?????????????????????? ???????????????? ???????????? ${this.min}`);
            }

            if (this.max && parseInt(this.max) < value && value) {
                messages.push(`???????????????? ?????????????????? ???????????????????????? ???????????????? ???????????? ${this.max}`);
            }
        }

        if ((value == '' || value === null || value == undefined) && this.required) {
            messages.push('???????????????? ???? ?????????? ???????? ????????????');
        }

        return messages.length > 0 ? messages.join(';') : undefined;
    }

    _getTabIndex(disabled) {
        return disabled ? -1 : 0;
    }
}

customElements.define('pl-input', PlInput);