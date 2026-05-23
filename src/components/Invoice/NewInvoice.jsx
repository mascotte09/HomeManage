import { useState } from "react";
import { useRef } from "react";
import Modal from "../Modal.jsx";

export default function NewTask({ onAdd }) {
    const [enteredTask, setEnteredTask] = useState("");

    const modal = useRef();

    function handleChange(event) {
        setEnteredTask(event.target.value);
    }

    function handleClick() {
        if (enteredTask.trim() === "") {
            modal.current.open();
            return;
        }

        onAdd(enteredTask);
        setEnteredTask("");
    }

    return (
        <>
            <Modal ref={modal} buttonCaption="Okay">
                <h2 className="text-xl font-bold text-stone-700 my-4">Invalid Input</h2>
                <p className="text-stone-600 mb-4">The task input should not be empty.</p>
            </Modal>

            <div className="flex items-center gap-4">
                <input
                    type="text"
                    className="w-64 px-2 py-1 rounded-sm bg-stone-200"
                    value={enteredTask}
                    onChange={handleChange}
                />

                <button className="text-stone-700 hover:text-stone-950" onClick={handleClick}>
                    Add Task
                </button>
            </div>
        </>
    );
}