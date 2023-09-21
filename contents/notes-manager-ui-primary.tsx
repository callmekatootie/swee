import localCSS from "data-text:~contents/notes-manager-style.css"
import globalCSS from "data-text:~global.css"
import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
import md5 from "md5"
import type {
  PlasmoCSConfig,
  PlasmoCSUIAnchor,
  PlasmoGetInlineAnchorList
} from "plasmo"
import { useMemo, useState } from "react"
import ShortUniqueId from "short-unique-id"

import { useStorage } from "@plasmohq/storage/hook"

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo("en-US")

const { randomUUID } = new ShortUniqueId({ length: 10 })

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
  document.querySelectorAll('[data-testid="normal-dish-item"]')

function useItemKey(itemName: string): string {
  const key = useMemo(() => {
    const restaurantName = window.location.pathname.split("/restaurants/")[1]
    const id = `${restaurantName}__${itemName}`

    return md5(id)
  }, [window.location, itemName])

  return key
}

type AddNotesBtnProp = {
  onClick: () => void
}

function AddNotesBtn({ onClick }: AddNotesBtnProp) {
  return (
    <button
      type="button"
      className="px-3 py-1 text-xs font-medium text-center inline-flex items-center rounded-lg cursor-pointer text-blue-700 hover:bg-blue-700 hover:text-white"
      onClick={onClick}>
      <div className="shrink-0 mr-2">
        <AddIcon isEmbedded={true} />
      </div>
      Add a note
    </button>
  )
}

type AddIconProp = {
  isEmbedded?: boolean
  onClick?: () => void
}

function AddIcon({ isEmbedded = false, onClick }: AddIconProp) {
  let wrapperClass = ""

  if (!isEmbedded) {
    wrapperClass =
      "text-gray-400 hover:text-lime-900 hover:bg-lime-100 cursor-pointer p-1 rounded-full"
  }

  return (
    <div className={wrapperClass} onClick={onClick}>
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
          d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  )
}

function InfoIcon() {
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
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    </div>
  )
}

type TrashIconProp = {
  onClick: () => void
}

function TrashIcon({ onClick }: TrashIconProp) {
  return (
    <div
      className="text-gray-400 hover:text-rose-900 hover:bg-rose-100 cursor-pointer p-1 rounded-full"
      onClick={onClick}>
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
          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
      </svg>
    </div>
  )
}

type NoteItemProp = {
  note: Note
  onDelete: (id: string) => void
  showAddBtn?: boolean
  onAdd?: () => void
}

function NoteItem({ note, onDelete, showAddBtn = false, onAdd }: NoteItemProp) {
  let addIconClass = "invisible"

  if (showAddBtn) {
    addIconClass = "visible"
  }

  return (
    <div className="flex items-center mb-4">
      <div className="w-11/12 rounded-md bg-blue-50 p-4 flex items-center mr-4">
        <InfoIcon />
        <div className="ml-3 flex flex-1 justify-between">
          <p className="text-sm text-blue-700">{note.content}</p>
          <p className="text-sm text-blue-700 ml-6 font-medium text-center">
            {timeAgo.format(new Date(note.createdAt))}
          </p>
        </div>
      </div>
      <TrashIcon onClick={() => onDelete(note.id)} />
      <div className={addIconClass}>
        <AddIcon onClick={onAdd} />
      </div>
    </div>
  )
}

type AddNotesFormProp = {
  onCancel: () => void
  onSave: (content: string) => void
}

function AddNotesForm({ onCancel, onSave }: AddNotesFormProp) {
  const [content, setContent] = useState("")

  return (
    <form action="#" className="relative w-full mb-4">
      <div className="overflow-hidden rounded-lg ring-blue-700 ring-1 ring-inset shadow-sm">
        <textarea
          rows={3}
          name="note"
          className="block w-full border-0 bg-transparent py-1.5 text-sm leading-6 resize-none"
          placeholder="Add a note"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus></textarea>
        <div className="py-2">
          <div className="py-px">
            <div className="h-9"></div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
        <button
          type="button"
          className="rounded-md bg-transparent px-3 py-2 text-sm font-semibold hover:bg-blue-700 hover:text-white"
          onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          onClick={() => onSave(content)}>
          Save
        </button>
      </div>
    </form>
  )
}

function NotesManagerUIPrimary({ anchor }: { anchor: PlasmoCSUIAnchor }) {
  const [showNotesInput, setShowNotesInput] = useState(false)
  const itemName = useMemo(
    () => anchor.element.querySelector(":scope h3").textContent,
    [anchor]
  )
  const itemKey = useItemKey(itemName)
  const [notes, setNotes] = useStorage<Note[]>(itemKey, [] as Note[])

  const onSave = async (content: string) => {
    if (!content.trim().length) {
      return
    }

    const newNote = {
      id: randomUUID(),
      content,
      createdAt: new Date().toISOString()
    }

    await setNotes([...notes, newNote])

    setShowNotesInput(false)
  }

  const onDelete = async (id: string) => {
    const filteredNotes = notes.filter((n) => n.id !== id)

    await setNotes([...filteredNotes])
  }

  let addNotesBtn
  let addNotesInput

  if (notes.length === 0 && !showNotesInput) {
    addNotesBtn = <AddNotesBtn onClick={() => setShowNotesInput(true)} />
  }

  if (showNotesInput) {
    addNotesInput = (
      <AddNotesForm onCancel={() => setShowNotesInput(false)} onSave={onSave} />
    )
  }

  return (
    <div className="plasmo-shield">
      {addNotesBtn}
      {notes.map((n, i) => (
        <NoteItem
          note={n}
          key={n.id}
          onDelete={onDelete}
          showAddBtn={i === notes.length - 1}
          onAdd={() => setShowNotesInput(true)}
        />
      ))}
      {addNotesInput}
    </div>
  )
}

export default NotesManagerUIPrimary
