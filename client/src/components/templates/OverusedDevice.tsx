"use client";

import { Modal } from "flowbite-react";
import { useState } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { OverusedDevices } from "@/types/type";

export function OverusedDeviceComponent(props: {
  data: OverusedDevices[];
  appliancesLength: number;
}) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <IoMdInformationCircleOutline onClick={() => setOpenModal(true)} />
      <Modal
        size="3xl"
        dismissible
        show={openModal}
        onClose={() => setOpenModal(false)}
        className="font-poppins"
      >
        <Modal.Body className="bg-gradient-to-br rounded-lg from-teal-100 via-teal-300 to-lightGray relative flex justify-center">
          <Carousel
            opts={{
              align: "start",
            }}
            orientation="vertical"
            className="w-full my-10"
          >
            <CarouselContent className="-mt-1 h-[320px]">
              {props.data.map((app, index) => (
                <CarouselItem key={index} className="pt-1 md:basis-1/2 w-full text-black">
                  <div className="p-1">
                    <Card className="relative border-none overflow-hidden rounded-2xl bg-gradient-to-br from-lightGray via-tealBright to-tealBright h-36">
                      <CardContent className="items-center justify-center p-3 flex flex-col">
                        <h1 className="text-lightGray font-bold text-xl">
                          {app.name}
                        </h1>
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center text-white font-semibold">
                            <div className="bg-white shadow-white h-[4.2rem] w-[4.2rem] rounded-full flex items-center justify-center mt-2 shadow-medium">
                              <div className="absolute shadow-white h-16 w-16 bg-gradient-to-br from-lightGray via-tealBright to-tealBright rounded-full flex justify-center items-center shadow-inner-medium">
                                <h1 className="text-white font-bold text-lg relative">
                                  {Math.round(app.averageUsage * 100) / 100}
                                </h1>
                                <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs">
                                  H
                                </p>
                              </div>
                            </div>
                            <h1>Avg</h1>
                          </div>
                          <div className="flex flex-col items-center text-red-600 font-semibold">
                            <div className="bg-red-600 shadow-red-600 h-[4.2rem] w-[4.2rem] rounded-full flex items-center justify-center mt-2 shadow-medium">
                              <div className="absolute shadow-red-600 h-16 w-16 bg-gradient-to-br from-lightGray via-tealBright to-tealBright rounded-full flex justify-center items-center shadow-inner-medium">
                                <h1 className="text-red-600 font-bold text-lg relative">
                                  {Math.round(app.duration * 100) / 100}
                                </h1>
                                <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs">
                                  H
                                </p>
                              </div>
                            </div>
                            <h1>Duration</h1>
                          </div>
                        </div>
                      </CardContent>
                      <div className="flex flex-col absolute bottom-1 left-3">
                        <h1 className="text-zinc-200 font-light -mb-1.5 text-xs">
                          From
                        </h1>
                        <h1 className="text-white font-semibold text-base">
                          {app.usageStartTime}
                        </h1>
                      </div>
                      <div className="flex flex-col absolute bottom-1 right-3">
                        <h1 className="text-zinc-200 font-light -mb-1.5 text-xs">
                          Until
                        </h1>
                        <h1 className="text-white font-semibold text-base">
                          {app.usageEndTime}
                        </h1>
                      </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-transparent border-none text-white hover:bg-transparent hover:text-white" />
            <CarouselNext className="bg-transparent border-none text-white hover:bg-transparent hover:text-white" />
          </Carousel>
          <h1 className="absolute bottom-5 right-8 text-neutral-900 text-sm font-light">
            <span className="font-bold text-red-500">{props.data.length}</span>{" "}
            out of <span className="font-bold text-tealBright">{props.appliancesLength}</span>{" "}
            exceeded average use.
          </h1>
        </Modal.Body>
      </Modal>
    </>
  );
}
