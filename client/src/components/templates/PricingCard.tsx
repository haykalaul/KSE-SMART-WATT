import { Modal } from "flowbite-react";
import { FaCheck } from "react-icons/fa6";

export default function PricingCard(props: {
  openModal: boolean;
  setOpenModal: (open: boolean) => void;
  handleSetPremium: () => void;
}) {
  const { openModal, setOpenModal, handleSetPremium } = props;
  return (
    <Modal
      size="lg"
      className=""
      dismissible
      show={openModal}
      onClose={() => setOpenModal(false)}
    >
      <div className="p-0.5 bg-gradient-to-b from-yellow-300 to-orange-400 rounded-lg">
        <div className="bg-zinc-950 rounded-md px-5">
          <Modal.Body>
            <h2 className="px-2 py-1 rounded-full uppercase font-inter border border-orange-400 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 absolute w-fit top-6 right-6 text-xs font-bold tracking-wider">
              Best Offer
            </h2>
            <div className="bg-gradient-to-b from-yellow-300 to-orange-400 p-0.5 w-fit rounded-full mt-10">
              <img
                className="p-1.5 bg-black h-20 w-20 rounded-full"
                src="/logo.webp"
                alt=""
              />
            </div>
            <h1 className="font-inter bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 text-3xl relative py-5">
              Premium
            </h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-yellow-300 to-orange-400 "></div>
            <h3 className="font-bold font-inter text-5xl text-white mt-4">
              IDR 9.900
              <span className="text-sm font-medium text-zinc-300">/month</span>
            </h3>
            <p className="font-inter mt-4 text-zinc-600 text-xs font-light">
              Track your appliance energy usage every day and stay in control.
            </p>
            <div className="flex text-white gap-2 mt-4 items-center font-inter">
              <div className="border-[1.5px] border-orange-400 rounded-full text-white text-sm w-fit p-1">
                <FaCheck />
              </div>
              <h1 className="text-lg">Smart Scheduling</h1>
            </div>
            <div className="flex text-white gap-2 mt-4 items-center font-inter">
              <div className="border-[1.5px] border-orange-400 rounded-full text-white text-sm w-fit p-1">
                <FaCheck />
              </div>
              <h1 className="text-lg">Daily Energy Monitoring</h1>
            </div>
            <button
              onClick={handleSetPremium}
              type="button"
              className="hover:shadow-strong hover:shadow-orange-400 duration-200 cursor-pointer w-full h-12 rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 mt-8 mb-4 font-inter font-semibold flex justify-center items-center text-black"
            >
              Uprade to Premium
            </button>
          </Modal.Body>
        </div>
      </div>
    </Modal>
  );
}
