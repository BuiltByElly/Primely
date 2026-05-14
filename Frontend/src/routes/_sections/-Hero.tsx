import { ArrowRight } from "lucide-react";
import Grid from "./-Grid";
import { Twitter } from "#/icons/twitter";
import { Email } from "#/icons/email";
import { Whatsapp } from "#/icons/whatsapp";
import { Link } from "@tanstack/react-router";

const Hero = () => {
  return (
    <div className="w-full min-h-full p-6 relative flex flex-col justify-end  overflow-y-clip">
      <Grid />
      <div className="flex flex-col gap-6 justify-start pt-12 mb-15 xl:justify-center xl:pt-0 xl:p-8 xl:h-[75vh] xl:mb-0 xl:text-center">
        <h1 className="text-7xl w-full font-manrope font-bold xl:w-[60%] xl:mx-auto xl:text-8xl">
          Shorten. <span className="text-primary">Scan.</span> Track.
        </h1>
        <p className="xl:w-[70%] font-manrope xl:mx-auto xl:text-lg">
          Primely is a full stack URL Shortner with automatic malware scanning,
          click event analytics, and a personal dashboard. Built as a portfolio
          project with FastAPI and Tanstack Start.
        </p>
        <Link to="/me">
          <button className="w-fit bg-primary p-3 flex items-center gap-3 rounded-lg hover:bg-primary-hover transition-colors xl:mx-auto">
            Get Started <ArrowRight />
          </button>
        </Link>
      </div>

      <div className="pb-0 flex flex-col gap-3 justify-between items-center xl:flex-row xl:gap-0">
        <p className="">
          Built By{" "}
          <a
            className="text-primary underline hover:text-primary-hover"
            href="https://elliot-otoijagha.pxxl.click"
          >
            Elliot Otoijagha
          </a>
        </p>
        <p className="flex gap-2">
          <a href="https://x.com/BuiltByElly">
            <button className=" border-border border p-2 transition-colors rounded-full hover:bg-primary">
              <Twitter width={18} height={18} />
            </button>
          </a>
          <a href="mailto:eroms072020@gmail.com">
            <button className=" border-border border p-2 transition-colors rounded-full hover:bg-primary">
              <Email width={18} height={18} />
            </button>
          </a>
          <a href="https://wa.link/4azzcy">
            <button className=" border-border border p-2 transition-colors rounded-full hover:bg-primary">
              <Whatsapp width={18} height={18} />
            </button>
          </a>
        </p>
      </div>
    </div>
  );
};

export default Hero;
