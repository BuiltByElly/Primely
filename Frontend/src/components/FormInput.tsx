import { Icon } from "@iconify/react";

interface FormInputProps {
  label: string;
  icon: string;
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
  icon,
  type,
  placeholder,
  name,
  value,
  onChange,
  required = true,
  iconWidth = 24,
  iconHeight = 24,
}: FormInputProps) => {
  return (
    <section className="mb-2">
      <div className="flex flex-col mb-2">
        <label className="text-foreground text-lg">{label}</label>
      </div>
      <div className="flex items-center gap-4 border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter">
        <Icon
          icon={icon}
          width={iconWidth}
          height={iconHeight}
          style={{ color: "var(--foreground)" }}
        />
        <input
          type={type}
          placeholder={placeholder}
          className="flex-1 focus:outline-none bg-transparent text-foreground placeholder-neutral"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
        />
      </div>
    </section>
  );
};

export default FormInput;
