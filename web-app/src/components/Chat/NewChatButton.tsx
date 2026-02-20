'use client'

import { useState } from 'react'
import CreateChatModal from './CreateChatModal'

type Props = {
    label?: string
    className?: string
}

export default function NewChatButton({ label = "+ Nouveau", className = "" }: Props) {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-sm transition-colors text-sm ${className}`}
            >
                {label}
            </button>
            {showModal && <CreateChatModal onClose={() => setShowModal(false)} />}
        </>
    )
}
