;(function () {
  document.addEventListener('DOMContentLoaded', async function () {
    try {
      var res = await fetch('/api/auth/me', { credentials: 'include' })

      if (!res.ok) {
        // Try refreshing the token
        var refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })
        if (refreshRes.ok) {
          res = await fetch('/api/auth/me', { credentials: 'include' })
        }
      }

      var actions = document.querySelector('.header-actions')
      if (!actions) return

      if (res.ok) {
        var data = await res.json()
        var loginBtn = actions.querySelector('.btn-login')
        var signupBtn = actions.querySelector('.btn-signup')
        if (loginBtn) loginBtn.style.display = 'none'
        if (signupBtn) signupBtn.style.display = 'none'

        var dashLink = document.createElement('a')
        dashLink.href = '/dashboard/'
        dashLink.className = 'btn btn-primary'
        dashLink.textContent = 'Dashboard'
        actions.appendChild(dashLink)
      }
    } catch (e) {
      // Silently fail — show default logged-out state
    }
  })
})()
