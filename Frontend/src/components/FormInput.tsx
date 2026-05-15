import { useState } from "react";
import { EyeOpen, EyeClosed } from "#/icons/eye";
// import { Icon } from "@iconify/react";

interface FormInputProps {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  type: string;
  placeholder: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  iconWidth?: number;
  iconHeight?: number;
}

const FormInput = ({
  label,
  icon: Icon,
  type,
  placeholder,
  name,
  value,
  onChange,
  required = true,
}: FormInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <section className="mb-2">
      <div className="flex flex-col mb-2">
        <label className="text-foreground text-lg">{label}</label>
      </div>
      <div className="flex items-center gap-4 border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter">
        <Icon />
        <input
          type={inputType}
          placeholder={placeholder}
          className="flex-1 focus:outline-none bg-transparent text-foreground placeholder-neutral"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="focus:outline-none flex items-center justify-center p-1 hover:bg-foreground/20 transition-colors rounded-lg"
          >
            {showPassword ? <EyeClosed /> : <EyeOpen stroke="#fff" />}
          </button>
        )}
      </div>
    </section>
  );
};

export default FormInput;
