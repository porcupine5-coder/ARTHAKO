import React from 'react'

const LoaderBoxes: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="loader-boxes">
        <div className="cube" aria-hidden>
          <div className="face front" />
          <div className="face back" />
          <div className="face left" />
          <div className="face right" />
          <div className="face top" />
          <div className="face bottom" />
        </div>
      </div>
    </div>
  )
}

export default LoaderBoxes
