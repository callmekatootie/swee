import localCSS from "data-text:~contents/notes-manager-style.css"
import globalCSS from "data-text:~global.css"
import md5 from "md5"
import type {
  PlasmoCSConfig,
  PlasmoCSUIAnchor,
  PlasmoGetInlineAnchorList
} from "plasmo"
import { useMemo } from "react"

import { useStorage } from "@plasmohq/storage/hook"

type Note = {
  id: string
  content: string
  createdAt: string
}

export const config: PlasmoCSConfig = {
  matches: ["https://www.swiggy.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `${globalCSS} ${localCSS}`
  return style
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
  document.querySelectorAll('[data-testid="menu-reorder-item"] i + span')

function useItemKey(itemName: string): string {
  const key = useMemo(() => {
    const restaurantName = window.location.pathname.split("/restaurants/")[1]
    const id = `${restaurantName}__${itemName}`

    return md5(id)
  }, [window.location, itemName])

  return key
}

function NotesIcon() {
  return (
    <div className="text-blue-700">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    </div>
  )
}

function NotesManagerUISecondary({ anchor }: { anchor: PlasmoCSUIAnchor }) {
  const nodes = [
    ...document.querySelectorAll('[data-testid="normal-dish-item"] h3')
  ]
  const item = nodes.filter(
    (n) => n.textContent === anchor.element.textContent
  )[0]

  let itemParent: Element | null

  if (item) {
    itemParent = item.closest('[data-testid="normal-dish-item"]')
  }

  const itemName = useMemo(() => anchor.element.textContent, [anchor])
  const itemKey = useItemKey(itemName)
  const [notes] = useStorage<Note[]>(itemKey, [] as Note[])

  const scrolToItem = () => {
    if (itemParent) {
      const { top } = itemParent.getBoundingClientRect()
      // 52 is the height of the restaurant name overlay + 5 for padding
      const offsetPosition = top + window.scrollY - 57

      window.scrollTo({
        top: offsetPosition
      })
    }
  }

  if (notes.length === 0) {
    return null
  }

  return (
    <div
      className="absolute -top-9 right-0 cursor-pointer opacity-50 hover:opacity-100"
      onClick={scrolToItem}>
      <NotesIcon />
    </div>
  )
}

export default NotesManagerUISecondary
