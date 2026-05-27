import { forwardRef } from "react";

const Input = forwardRef(function Input({ textArea, label, error, ...props }, ref) {
    const classes =
    "w-full px-2 py-1 text-sm border-b rounded-sm border-stone-300 bg-stone-200 text-stone-600 focus:outline-none focus:border-stone-600";
    return (
        <div  className="flex flex-col items-start w-full">
            <label className="text-left text-xs font-bold uppercase text-stone-500">
                {label}
            </label>
            {textArea ? (
                <textarea ref={ref} className={classes} {...props} />
            ) : (
                <input ref={ref} className={classes} {...props} />
                
            )}
            {error && (<div className="min-h-[20px]">                
                <p className="text-sm text-red-500">
                    {error}
                </p>                
            </div>)}
        </div >
    );
});

export default Input;