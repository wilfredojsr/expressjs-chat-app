Mustache.tags = ['<%', '%>'];

if (typeof window.io === 'function') {
  const socket = io()
  const $form = document.querySelector('#form-message')
  const $inputMessage = $form.querySelector('input')
  const $btnSendMessage = $form.querySelector('button')
  const $btnSendLocation = document.querySelector('#send-location')
  const $messages = document.querySelector('#messages')

  // Templates
  const tplMessage = document.querySelector('script#message-template').innerHTML
  const tplLocationMessage = document.querySelector('script#location-message-template').innerHTML
  const tplSidebar = document.querySelector('script#sidebar-template').innerHTML

  // Options
  const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});
  const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    const visibleHeight = $messages.offsetHeight
    const conatinerHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (conatinerHeight - newMessageHeight <= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight
    }
  }

  socket.on('message', (message) => {
    const html = Mustache.render(tplMessage, {
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
  })

  socket.on('locationMessage', (message) => {
    const html = Mustache.render(tplLocationMessage, {
      username: message.username,
      url: message.url,
      createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
  })

  socket.on('roomData', ({room, users}) => {
    document.querySelector('#sidebar').innerHTML = Mustache.render(tplSidebar, {
      room,
      users
    })
  })

  $form.addEventListener('submit', (e) => {
    e.preventDefault()

    if (!$inputMessage.value || $inputMessage.value === '') {
      $inputMessage.focus()
      return false;
    }

    $btnSendMessage.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', $inputMessage.value, (error) => {

      $btnSendMessage.removeAttribute('disabled')
      $inputMessage.focus()

      if (error) {
        return console.log(error)
      }

    })
    $inputMessage.value = ''
  })

  $btnSendLocation.addEventListener('click', () => {
    if (!window.navigator && !window.navigator.geolocation) {
      return alert('Geolocation is not supported by your browser.')
    }

    $btnSendLocation.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {

      socket.emit('sendLocation', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }, () => {
        $btnSendLocation.removeAttribute('disabled')
      })
    })
  })

  socket.emit('join', {username, room}, (error) => {
    if (error) {
      alert(error)
      location.href = '/'
    }
  })
}
