import type { PlasmoCSConfig  } from "plasmo";
import { Storage } from "@plasmohq/storage"
import { ALARM_NAMES, ORDER_KEY_TYPES, getOrderKey } from "./delivery-monitor-common"

const TEN_SECONDS_IN_MS = 10000

const INTERVAL_REFS = {
  INITIALIZE_MONITOR: null,
  MONITOR_DELIVERY: null,
  MONITOR_DELIVERED: null,
}

const storage = new Storage()

export const config: PlasmoCSConfig = {
  matches: ["https://www.swiggy.com/*"]
}

function getEstimatedDelivery(): string | null {
  const currentETAXPath = '//div[text()="ARRIVING IN"]/following-sibling::div[1]/text()'
  const currentETANode = document.evaluate(currentETAXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue

  if (currentETANode) {
    const mins = parseInt(currentETANode.textContent.split(" mins")[0], 10)
    const currentDateTime = new Date()
    currentDateTime.setMinutes(currentDateTime.getMinutes() + mins, 0, 0)

    console.log("getEstimatedDelivery", currentDateTime.toISOString())

    return currentDateTime.toISOString()
  }

  console.log("getEstimatedDelivery did not find data")

  return null
}

function checkForDeliveredStatus(): boolean {
  const completedDeliveryXPath = '//h2[text()="Order Delivered"]'
  const completedDeliveryNode = document.evaluate(completedDeliveryXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue

  if (completedDeliveryNode) {
    console.log("checkForDeliveredStats", true)
    return true
  }

  console.log("checkForDeliveredStats did not find data")

  return false
}

async function registerInitAlarm() {
  // Check for initial ETA every 10 seconds
  INTERVAL_REFS.INITIALIZE_MONITOR = setInterval(async () => await handleAlarms(ALARM_NAMES.INITIALIZE_MONITOR), TEN_SECONDS_IN_MS)
  console.log("registerInitAlarm sets up initialize monitor interval")
}

async function handleInitialDelivery() {
  const deliveryTime = getEstimatedDelivery()

  if (!deliveryTime) {
    console.log("handleInitialDelivery did not find data")
    return
  }

  const initialOrderKey = getOrderKey(ORDER_KEY_TYPES.INITIAL)
  await storage.set(initialOrderKey, deliveryTime)
  const currentOrderKey = getOrderKey(ORDER_KEY_TYPES.CURRENT)
  await storage.set(currentOrderKey, deliveryTime)

  // We know the initially promised time
  // We now only need to monitor any updates to the promised time
  // Trigger the alarm to monitor the delivery time periodically
  clearInterval(ALARM_NAMES.INITIALIZE_MONITOR)

  await registerMonitorAlarm()
  console.log("handleInitialDelivery cleared initialize alarm and registered monitor delivery alarm")
}

async function registerMonitorAlarm() {
  // Check for ETA every 10 seconds
  INTERVAL_REFS.MONITOR_DELIVERY = setInterval(() => handleAlarms(ALARM_NAMES.MONITOR_DELIVERY), TEN_SECONDS_IN_MS)
  // Check for delivered status every 10 seconds
  INTERVAL_REFS.MONITOR_DELIVERED = setInterval(() => handleAlarms(ALARM_NAMES.MONITOR_DELIVERED), TEN_SECONDS_IN_MS)
  // TODO - Check for cancelled status every 10 seconds
  console.log("registerMonitorAlarm registered two interval functions to check for delivery and delivered statuses")
}

async function handleUpdatedDelivery() {
  const deliveryTime = getEstimatedDelivery()

  if (!deliveryTime) {
    console.log("handleUpdatedDelivery did not find data")
    return
  }

  const currentOrderKey = getOrderKey(ORDER_KEY_TYPES.CURRENT)
  await storage.set(currentOrderKey, deliveryTime)
  console.log("handleUpdatedDelivery", deliveryTime)
}

async function handleDeliveredStatus() {
  const hasDelivered = checkForDeliveredStatus()

  if (hasDelivered) {
    // Clear all alarms
    clearAllIntervals()
    console.log("handleDeliveredStatus cleared all alarms")
  }
}

async function handleAlarms(alarmName: string) {
  console.log(alarmName, "triggered")
  if (alarmName === ALARM_NAMES.INITIALIZE_MONITOR) {
    await handleInitialDelivery()
  } else if (alarmName === ALARM_NAMES.MONITOR_DELIVERY) {
    await handleUpdatedDelivery()
  } else if (alarmName === ALARM_NAMES.MONITOR_DELIVERED) {
    await handleDeliveredStatus()    
  }
}

function clearAllIntervals() {
  Object.keys(INTERVAL_REFS).forEach(ref => clearInterval(INTERVAL_REFS[ref]))
  console.log("clear all intervals triggered")
}

async function init() {
  /**
   * We fetch the order id and the delivery details for that order
   * from Storage, if one exists. Else we detect the delivery details for
   * the order and proceed to save in Storage.
   * After this, we start monitoring the delivery progress
   */
  const initialOrderKey = getOrderKey(ORDER_KEY_TYPES.INITIAL)

  if (!initialOrderKey) {
    console.log("No initial order key found on script load")
    return
  }

  const eta = await storage.get(initialOrderKey)

  if (eta) {
    console.log("ETA key found", eta)
    console.log("Registering monitor alarm")
    await registerMonitorAlarm()
  } else {
    console.log("ETA key NOT found", eta)
    console.log("Registering init alarm")
    await registerInitAlarm()
  }
}

const initOnce = (() => {
  let executed = false
  console.log("await init once")

  return async function () {
    if (!executed) {
      executed = true
      console.log("await init")
      await init()
    }
  }
})()

function addLocationObserver(cb) {
  const config = {
    attributes: false,
    childList: true,
    subtree: false
  }

  const observer = new MutationObserver(cb)

  observer.observe(document.body, config)
}

async function observerCallback() {
  console.log("obsderver callback")
  if (window.location.pathname.startsWith("/order-track")) {
    // Either user refreshes page or lands on
    // order tracking page by navigating from home page
    // Ensure that initialization happens only once
    await initOnce()
  }
}

window.addEventListener("load", async () => {
  // Why not call init() here? See https://stackoverflow.com/q/71935684/2104976
  addLocationObserver(observerCallback)
  await observerCallback()
})

window.addEventListener("unload", async () => {
  console.log("Window unload event")
  clearAllIntervals()
})

// * Perhaps I use requestAnimationFrame instead of setInterval() because it seems like setInteval() isn't reliable in a content script
// * See https://stackoverflow.com/a/28521241/2104976
