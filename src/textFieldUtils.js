/** Native input attributes that disable browser autofill, autocorrect, and spell-check. */
export const NO_AUTOFILL_HTML_INPUT_PROPS = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: 'false',
};

/** Merge no-autofill props into MUI TextField slotProps (keeps adornments etc.). */
export function withNoAutofill(slotProps = {}) {
  return {
    ...slotProps,
    htmlInput: {
      ...NO_AUTOFILL_HTML_INPUT_PROPS,
      ...slotProps.htmlInput,
    },
  };
}
