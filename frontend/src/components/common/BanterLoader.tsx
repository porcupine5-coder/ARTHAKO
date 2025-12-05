import React from 'react'

const BanterLoader: React.FC = () => {
  return (
    <div className="banter-loader-wrapper" style={{ position: 'relative', minHeight: 120 }}>
      <div className="banter-loader" aria-hidden>
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
        <div className="banter-loader__box" />
      </div>
    </div>
  )
}

export default BanterLoader
