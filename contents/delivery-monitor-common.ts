function getOrderId(): string | undefined {
  if (!window) {
    throw Error("getOrderId() must be called from a non background script")
  }

  const currentLocation = new URL(window.location.href)
  const orderId = currentLocation.pathname.split('/order-track/')[1]

  return orderId
}

export const ALARM_NAMES = {
  INITIALIZE_MONITOR: "swee_initialize-delivery-monitor",
  MONITOR_DELIVERY: "swee_delivery-monitor",
  MONITOR_DELIVERED: "swee_delivered"
}

export enum ORDER_KEY_TYPES {
  CURRENT,
  INITIAL
}

export function getOrderKey(type: ORDER_KEY_TYPES): string | null {
  const orderId = getOrderId()

  if (!orderId) {
    return null
  }

  if (type === ORDER_KEY_TYPES.CURRENT) {
    return `swee_${orderId}-current`
  } else {
    return `swee_${orderId}-initial`
  }
}

export const ONE_SECOND_IN_MILLISECONDS = 1000
