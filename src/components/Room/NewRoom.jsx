import { useRef } from "react";
import Input from "../InputVal.jsx";
import Modal from "../Modal.jsx";
import RoomService from "../services/roomService";

export default function NewRoom({ homeID, onAdd, onCancel }) {
    const modal = useRef();

    const roomName = useRef();
    const roomRenter = useRef();
    const dueDate = useRef();

    async function handleSave() {

        const enteredRoomName = roomName.current.value;
        const enteredTenant = roomRenter.current.value;

        if (
            enteredRoomName.trim() === "" ||
            enteredTenant.trim() === ""
        ) {
            modal.current.open();
            return;
        }

        try {

            const savedRoom = await RoomService.createRoom({
                home_id: homeID, // pass current home id
                room_name: enteredRoomName,
                room_renter: enteredTenant,
            });

            onAdd(savedRoom);

        } catch (error) {

            console.log(error.message);
            alert("Failed to save room");
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
                    <Input type="text" ref={roomName} label="Title" />
                    <Input ref={roomRenter} label="Description" textArea />
                    <Input type="date" ref={dueDate} label="Due Date" />
                </div>
            </div>
        </>
    );
}