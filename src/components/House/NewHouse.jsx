import { useRef } from "react";
import Input from "../InputVal.jsx";
import Modal from "../Modal.jsx";
import HouseService from "../services/houseService";

export default function NewHouse({ userID, onAdd, onCancel }) {
    const modal = useRef();

    const name = useRef();
    const address = useRef();

    async function handleSave() {

        const enteredName = name.current.value;
        const enteredAddress = address.current.value;

        if (
            enteredName.trim() === "" ||
            enteredAddress.trim() === ""
        ) {
            modal.current.open();
            return;
        }

        try {

            const savedHouse = await HouseService.createHouse({
                user_id: userID, // pass current home id
                name: enteredName,
                address: enteredAddress,
            });

            onAdd(savedHouse);

        } catch (error) {

            console.log(error.message);
            alert("Failed to save house");
        }
    }
    return (
        <>
            <Modal ref={modal} buttonCaption="Okay">
                <h2 className="text-xl font-bold text-stone-700 my-4">Invalid Input</h2>
                <p className="text-stone-600 mb-4">Looks like you forgot to enter a value.</p>
                <p className="text-stone-600 mb-4">Please make sure you provide a valid value for every input field.</p>
            </Modal>

            <div className="w-[35rem] mt-16">
                <menu className="flex items-center justify-end gap-4 my-4">
                    <li>
                        <button className="text-stone-800 hover:text-stone-950" onClick={onCancel}>
                            Cancel
                        </button>
                    </li>
                    <li>
                        <button
                            className="px-6 py-2 rounded-md bg-stone-800 text-stone-50 hover:bg-stone-950"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                    </li>
                </menu>

                <div>
                    <Input type="text" ref={name} label="Title" />
                    <Input ref={address} label="Description" textArea />
                </div>
            </div>
        </>
    );
}