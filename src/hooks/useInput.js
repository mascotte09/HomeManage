import { useState } from "react";

export function useInput(defaultValue, validationFn) {
    const [enteredValue, setEnteredValue] = useState(defaultValue);
    // The state to keep track of whether the user has edited the input fields
    const [didEdit, setDidEdit] = useState(false);

    const valueIsValid = validationFn(enteredValue);

    // Validate the input on every keystroke with the help of the state
    // const emailIsInvalid = enteredValues.email !== "" && !enteredValues.email.includes("@");
    function handleInputChange(event) {
        setEnteredValue(event.target.value);

        setDidEdit(false);
    }

    // Validate the input upon lost focus (Blur)
    // Give user a chance of editing the input before showing the error message
    function handleInputBlur() {
        setDidEdit(true);
    }

    return {
        value: enteredValue,
        handleInputChange,
        handleInputBlur,
        hasError: didEdit && !valueIsValid,
    };
}

