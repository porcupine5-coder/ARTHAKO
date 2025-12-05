import React from 'react'

const Loader: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="loader" aria-hidden>
        <div className="loader__bar" />
        <div className="loader__bar" />
        <div className="loader__bar" />
        <div className="loader__bar" />
        <div className="loader__bar" />
        <div className="loader__ball" />
      </div>
    </div>
  )
}

export default Loader
