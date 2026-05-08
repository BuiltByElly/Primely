import { Email } from "#/icons/email";
import { Twitter } from "#/icons/twitter";
import { Whatsapp } from "#/icons/whatsapp";

const Footer = () => {
  return (
    <div className=" text-center p-3">
      <div className="opacity-50 w-full h-[.05rem] bg-foreground rounded-full" />
      <p className="my-4 font-manrope tracking-wide">
        Built By{" "}
        <a
          href="https://elliot-otoijagha.pxxl.click"
          className="text-accent underline"
        >
          Elliot Otoijagha
        </a>
      </p>
      <p className="text-sm text-neutral">
        Having any issue? Contact me on any of these platforms.
      </p>

      <div className="flex gap-3 items-center justify-center text-neutral mt-2">
        <a href="https://x.com/BuiltByElly" target="_blank">
          <Twitter />
        </a>
        <a href="mailto:eroms072020@gmail.com" target="_blank">
          <Email width={22} height={22} />
        </a>
        <a href="https://wa.link/4azzcy" target="_blank">
          <Whatsapp />
        </a>
      </div>
    </div>
  );
};

export default Footer;
