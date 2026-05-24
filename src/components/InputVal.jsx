import { forwardRef } from "react";

const Input = forwardRef(function Input({ textArea, label, ...props }, ref) {
    const classes =
        "w-full p-1 border-b-2 rounded-sm border-stone-300 bg-stone-200 text-stone-600 focus:outline-none focus:border-stone-600";

    return (
        <div  className="flex flex-col items-start w-full">
            <label className="text-left font-bold uppercase text-stone-500">{label}</label>
            {textArea ? (
                <textarea ref={ref} className={classes} {...props} />
            ) : (
                <input ref={ref} className={classes} {...props} />
            )}
        </div >
    );
});

export default Input;