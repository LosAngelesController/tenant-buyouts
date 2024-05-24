import React, { useState } from "react";
import classes from "./InfoCarousel.module.css";
interface CarouselProps {
  evictionData: any[];
  infoBoxLength: number;
  setInfoBoxLength: any;
  evictionInfo: number;
  setEvictionInfo: any;
}

export function InfoCarousel(props: CarouselProps) {
  const dataLength = props.evictionData.length;

  const handleNext = () => {
    props.setEvictionInfo((prev: any) =>
      prev === dataLength - 1 ? 0 : prev + 1
    );
    props.setInfoBoxLength((prev: any) => (prev === dataLength ? 1 : prev + 1));
  };

  const handlePrev = () => {
    props.setEvictionInfo((prev: any) =>
      prev === 0 ? dataLength - 1 : prev - 1
    );
    props.setInfoBoxLength((prev: any) => (prev === 1 ? dataLength : prev - 1));
  };

  return (
    <div className={classes.carousel}>
      <div className={classes.arrow} onClick={handlePrev}>
        &#8249;
      </div>
      <div className={classes.content}>
        <>
          <div>
            <p className="pr-4">
              <b className="text-stone-400">Council District:</b>{" "}
              {props.evictionData[props.evictionInfo]?.cd} <br />
              <b className="text-stone-400">Address:</b>{" "}
              {props.evictionData[props.evictionInfo]?.address} <br />
              <b className="text-stone-400">City:</b>{" "}
              {props.evictionData[props.evictionInfo]?.city} <br />
              <b className="text-stone-400">State:</b>{" "}
              {props.evictionData[props.evictionInfo]?.state} <br />
              <b className="text-stone-400">Zip:</b>{" "}
              {props.evictionData[props.evictionInfo]?.zip} <br />
              <b className="text-stone-400">Date Filed:</b>{" "}
              {props.evictionData[props.evictionInfo]?.filed} <br />
              <b className="text-stone-400">Amount:</b>{" "}
              {props.evictionData[props.evictionInfo]?.amount} <br />
              <b className="text-stone-400">Year:</b>{" "}
              {props.evictionData[props.evictionInfo]?.year} <br />
              <b className="text-stone-400">Rent Credit:</b>{" "}
              {props.evictionData[props.evictionInfo]?.rentCredit} <br />
            </p>
          </div>
          <div className="mt-3">
            <span>
              {props.infoBoxLength} of {dataLength}
            </span>
          </div>
        </>
      </div>
      <div className={classes.arrow} onClick={handleNext}>
        &#8250;
      </div>
    </div>
  );
}
