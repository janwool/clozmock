;(function () {
  var isSignUpMode = false
  var text = window.__AUTH_TEXT__ || {}

  // ===== Modal Open/Close =====
  window.openLoginModal = function (mode) {
    isSignUpMode = mode === 'signup'
    updateUI()
    resetForm()
    document.getElementById('login-modal').style.display = 'flex'
    document.body.style.overflow = 'hidden'
  }

  window.closeLoginModal = function () {
    document.getElementById('login-modal').style.display = 'none'
    document.body.style.overflow = ''
    hideError()
  }

  // ===== UI Updates =====
  function updateUI() {
    document.getElementById('modal-title').textContent =
      isSignUpMode ? text.createAccount : text.welcomeBack
    document.getElementById('name-field').style.display =
      isSignUpMode ? 'block' : 'none'
    document.getElementById('auth-submit-btn').textContent =
      isSignUpMode ? text.signUp : text.signIn
    document.getElementById('toggle-label').textContent =
      isSignUpMode ? text.hasAccount : text.noAccount
    document.getElementById('toggle-mode').textContent =
      isSignUpMode ? text.signIn : text.signUp
  }

  function resetForm() {
    document.getElementById('auth-email').value = ''
    document.getElementById('auth-password').value = ''
    document.getElementById('auth-name').value = ''
    hideError()
  }

  function showError(msg) {
    var el = document.getElementById('auth-error')
    el.textContent = msg
    el.style.display = 'block'
  }

  function hideError() {
    var el = document.getElementById('auth-error')
    el.textContent = ''
    el.style.display = 'none'
  }

  function setLoading(loading) {
    var btn = document.getElementById('auth-submit-btn')
    var googleBtn = document.getElementById('btn-google-auth')
    btn.disabled = loading
    googleBtn.disabled = loading
    if (loading) {
      btn.style.opacity = '0.6'
      googleBtn.style.opacity = '0.6'
    } else {
      btn.style.opacity = ''
      googleBtn.style.opacity = ''
    }
  }

  // ===== Event Listeners =====
  document.addEventListener('DOMContentLoaded', function () {
    // Toggle auth mode
    document.getElementById('toggle-mode').addEventListener('click', function (e) {
      e.preventDefault()
      isSignUpMode = !isSignUpMode
      updateUI()
      hideError()
    })

    // Form submit
    document.getElementById('login-form').addEventListener('submit', async function (e) {
      e.preventDefault()
      hideError()

      var email = document.getElementById('auth-email').value
      var password = document.getElementById('auth-password').value

      setLoading(true)
      try {
        var url = isSignUpMode ? '/api/auth/register' : '/api/auth/login'
        var body = { email: email, password: password }

        if (isSignUpMode) {
          body.displayName = document.getElementById('auth-name').value || ''
        }

        var res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          var data = await res.json()
          throw new Error(data.error || text.authFailed || 'Authentication failed')
        }

        window.location.href = '/dashboard/'
      } catch (err) {
        showError(err.message || text.authFailed || 'Authentication failed')
        setLoading(false)
      }
    })

    // Google sign-in — redirect flow
    document.getElementById('btn-google-auth').addEventListener('click', function () {
      var redirect = window.location.pathname
      window.location.href = '/api/auth/google?redirect=' + encodeURIComponent(redirect)
    })

    // Close on overlay click
    document.getElementById('login-modal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) {
        closeLoginModal()
      }
    })

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (
        e.key === 'Escape' &&
        document.getElementById('login-modal').style.display === 'flex'
      ) {
        closeLoginModal()
      }
    })
  })
})()
