# webrtc_sample
WebRTC sample application.

# Rrequire
- Ubuntu 14.04
- node.js
- npm

# Set Up

## App / Signaling Server
```sh
$ sudo apt-get update
$ sudo apt-get install nodejs npm
$ sudo update-alternatives --install /usr/bin/node node /usr/bin/nodejs
$ sudo npm install -g bower

$ git clone git@github.com:umatoma/webrtc_sample.git
$ cd webrtc_sample
$ npm install
$ bower install
```

## STUN / TURN Server
```sh
$ apt-get install rfc5766-turn-server
```

# Start

## App / Signaling Server
```sh
$ npm start

// use forever
$ forever start --uid "webrtc" ./bin/www
$ forever restart webrtc
$ forever stop webrtc
```

## STUN / TURN Server
```sh
$ /usr/bin/turnserver --daemon --verbose -c /etc/turnserver.conf
```

# License
Code released under [the MIT lisence](https://github.com/umatoma/webrtc_sample/blob/master/LICENSE).
