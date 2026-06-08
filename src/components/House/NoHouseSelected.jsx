import noProjectImage from "../../assets/logo.jpg";

export default function NoHouseSelected({ onStartAddHouse }) {
    return (
        <div className="mt-24 text-center w-2/3">
            <img src={noProjectImage} alt="An empty task list" className="w-16 h-16 object-contain mx-auto" />

            <h2 className="text-xl font-bold text-stone-500 my-4">Chọn một nhà hoặc tạo mới Nhà</h2>

        </div>
    );
}