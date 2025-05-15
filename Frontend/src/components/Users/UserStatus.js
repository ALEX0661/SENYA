import React, { useEffect, useState, useRef } from 'react'
import {
  getUserStatus,
  refreshHearts,
  getHeartTimer
} from '../../services/userService'
import './UserStatus.css'

function UserStatus() {
  const [userStatus, setUserStatus] = useState({
    hearts: 0,
    rubies: 0,
    streak: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [token] = useState(localStorage.getItem('accessToken'))
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState(0)
  const timerRef = useRef(null)

  // Fetch both status + timer once on mount (when token ready)
  useEffect(() => {
    if (!token) {
      setError('Not authenticated. Please log in.')
      setIsLoading(false)
      return
    }

    const bootstrap = async () => {
      try {
        setIsLoading(true)
        const [status, seconds] = await Promise.all([
          getUserStatus(),
          getHeartTimer()
        ])
        setUserStatus(status)
        setTimeUntilNextHeart(seconds)
      } catch (err) {
        console.error(err)
        setError('Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [token])

  // Countdown every second; when it hits zero, refresh hearts + timer
  useEffect(() => {
    if (timeUntilNextHeart == null) return

    // Clear any previous
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(async () => {
      setTimeUntilNextHeart(prev => {
        if (prev <= 1) {
          // expired! refresh both hearts and timer
          handleTimerExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeUntilNextHeart])

  const handleTimerExpire = async () => {
    try {
      // 1) pull new hearts count
      const refreshed = await refreshHearts()
      setUserStatus(s => ({ ...s, hearts: refreshed.hearts }))

      // 2) re‑fetch next-timer from backend
      const seconds = await getHeartTimer()
      setTimeUntilNextHeart(seconds)
    } catch (err) {
      console.error('Error auto‑refreshing hearts:', err)
    }
  }

  const formatTime = seconds => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (isLoading) return <div className="user-status-loading">Loading...</div>
  if (error)
    return (
      <div className="user-status-error">
        <p>{error}</p>
      </div>
    )

  return (
    <div className="user-status-container">
      <div className="currency-item">
        <span className="currency-icon">🔥</span>
        <span className="currency-value">{userStatus.streak}</span>
      </div>
      
      <div className="currency-item hearts-container">
        <span className="currency-icon">❤️</span>
        <span className="currency-value">{userStatus.hearts}</span>
        {timeUntilNextHeart > 0 && (
          <span className="heart-timer">
            +1 in {formatTime(timeUntilNextHeart)}
          </span>
        )}
      </div>
      
      <div className="currency-item">
        <span className="currency-icon">💎</span>
        <span className="currency-value">{userStatus.rubies}</span>
      </div>
    </div>
  )
}

export default UserStatus