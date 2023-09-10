import React, { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react'
import type { PlasmoCSConfig, PlasmoGetOverlayAnchor, PlasmoWatchOverlayAnchor } from "plasmo"
import { useStorage } from "@plasmohq/storage/hook"
import cssText from "data-text:~/contents/style.css"
import { ONE_SECOND_IN_MILLISECONDS, ORDER_KEY_TYPES, getOrderKey } from "./common"

export const config: PlasmoCSConfig = {
  matches: ["https://www.swiggy.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = () => {
  const promisedDeliveryLabelXPath = '//div[text()="ARRIVING IN"]'
  const ETANode = document.evaluate(promisedDeliveryLabelXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue

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

function DeliveryTimeMonitor() {
  const getStorageKey = useCallback(getOrderKey, [window.location.href])

  const intialOrderKey = getStorageKey(ORDER_KEY_TYPES.INITIAL)
  const currentOrderKey = getStorageKey(ORDER_KEY_TYPES.CURRENT)

  if (!intialOrderKey || !currentOrderKey) {
    return null
  }

  // Get the captured ETA
  const [predictedETA] = useStorage(intialOrderKey)
  const [actualETA] = useStorage(currentOrderKey)

  let status: ReactElement

  const prediction = new Date(predictedETA)
  const actual = new Date(actualETA)

  if (prediction < actual) {
    status = (
      <div className="status-wrapper status-negative">
        Delayed<br />({Math.floor((actual.valueOf() - prediction.valueOf()) / 60e3)} mins)
      </div>
    )
  } else if (prediction > actual) {
    status = (
      <div className="status-wrapper status-positive">
        Ahead<br />({Math.floor((prediction.valueOf() - actual.valueOf()) / 60e3)} mins)
      </div>
    )
  } else {
    status = (
      <div className="status-wrapper status-neutral">
        As Promised
      </div>
    )
  }

  return (
    <div className="container">
      <div className="wrapper">
        <div className="label">PREDICTED</div>
        <div className="value">{prediction.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        <div className="label">ACTUAL</div>
        <div className="value">{actual.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        {status}
      </div>
    </div>
  )
}

export default DeliveryTimeMonitor
