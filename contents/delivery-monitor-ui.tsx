import localCss from "data-text:~contents/delivery-monitor-style.css"
import globalCSS from "data-text:~global.css"
import type {
  PlasmoCSConfig,
  PlasmoGetOverlayAnchor,
  PlasmoWatchOverlayAnchor
} from "plasmo"
import { useCallback } from "react"
import type { ReactElement } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import {
  getOrderKey,
  ONE_SECOND_IN_MILLISECONDS,
  ORDER_KEY_TYPES
} from "./delivery-monitor-common"

export const config: PlasmoCSConfig = {
  matches: ["https://www.swiggy.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `${globalCSS} ${localCss}`
  return style
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = () => {
  const promisedDeliveryLabelXPath = '//div[text()="ARRIVING IN"]'
  const ETANode = document.evaluate(
    promisedDeliveryLabelXPath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue

  if (ETANode) {
    return ETANode as Element
  }
}

export const watchOverlayAnchor: PlasmoWatchOverlayAnchor = (
  updatePosition
) => {
  const interval = setInterval(() => {
    updatePosition()
  }, ONE_SECOND_IN_MILLISECONDS)

  return () => {
    clearInterval(interval)
  }
}

function DeliveryMonitorUI() {
  const getStorageKey = useCallback(getOrderKey, [window.location.href])

  const intialOrderKey = getStorageKey(ORDER_KEY_TYPES.INITIAL)
  const currentOrderKey = getStorageKey(ORDER_KEY_TYPES.CURRENT)

  if (!intialOrderKey || !currentOrderKey) {
    return null
  }

  // Get the captured ETA
  const [predictedETA] = useStorage(intialOrderKey)
  const [actualETA] = useStorage(currentOrderKey)

  let statusText: ReactElement
  let statusClass: string

  const prediction = new Date(predictedETA)
  const actual = new Date(actualETA)

  if (prediction < actual) {
    statusText = (
      <>
        DELAYED
        <br />({Math.floor(
          (actual.valueOf() - prediction.valueOf()) / 60e3
        )}{" "}
        MINS)
      </>
    )
    statusClass = "bg-rose-400"
  } else if (prediction > actual) {
    statusClass = "bg-green-400"
    statusText = (
      <>
        AHEAD
        <br />({Math.floor(
          (prediction.valueOf() - actual.valueOf()) / 60e3
        )}{" "}
        MINS)
      </>
    )
  } else {
    statusClass = "bg-amber-400"
    statusText = <>AS PROMISED</>
  }

  return (
    <div className="z-10 rounded w-[100px] shadow-md bg-slate-800">
      <div className="flex flex-col justify-center items-center text-white">
        <div className="pt-2.5 pb-0.5 opacity-60 text-xs">ESTIMATED</div>
        <div className="pb-2 text-base font-semibold">
          {prediction.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
        <div className="pt-2.5 pb-0.5 opacity-60 text-xs">ACTUAL</div>
        <div className="pb-2 text-base font-semibold">
          {actual.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
        <div
          className={`w-[72px] rounded text-center mb-4 p-2 text-xs font-bold ${statusClass}`}>
          {statusText}
        </div>
      </div>
    </div>
  )
}

export default DeliveryMonitorUI
