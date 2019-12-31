/*
* Compatibility version of loader.js
* Used in internet explorer
* */


window.Loader = function (options) {
    this._hashListener = this._onHashChanged.bind(this)
    this.currentTemplate = ''
    this._hashListenerRegistered = false

    this._getOpts(options)
    this.setListening(true)
    this._onHashChanged()
}

window.Loader.prototype = {
    load: function (template) {
        let me = this
        this._fetchTemplate(template, function (el) {
            me._setTemplate(el)
            me.currentTemplate = template
            me._setTitle()
            me._dispatchLoadedEvent()
        }, function (status) {
            console.log('error, cannot load template: ' + status)
            window.location.hash = '#' + this.errorTemplate
        })
    },

    setListening: function (listening) {
        if (listening && !this._hashListenerRegistered) {
            window.addEventListener('hashchange', this._hashListener, true)
            this._hashListenerRegistered = true

        } else if (!listening && this._hashListenerRegistered) {
            window.removeEventListener('hashchange', this._hashListener, true)
            this._hashListenerRegistered = false
        }
    },

    _getOpts: function (options) {
        //mandatory
        this.contentEl = options.contentEl
        this.defaultTemplate = options.defaultTemplate

        //optional
        this.templatesDir = options.templatesDir || '/templates'
        this.updateTitle = options.updateTitle || true
        this.scrollTop = options.scrollTop || true
        this.errorTemplate = options.errorTemplate || this.defaultTemplate

        if (this.updateTitle) {
            this.titleBase = options.titleBase
        }
    },

    _onHashChanged: function () {
        const template = window.location.hash.replace('#', '') || this.defaultTemplate
        this.load(template)
    },

    _fetchTemplate: function (template, callback, errorCallback) {

        let request = new XMLHttpRequest()
        let me = this
        request.addEventListener('load', function (evt) {
            if (request.status === 200) {
                callback(me._parseTemplate(request.responseText))
            } else {
                errorCallback(request.status)
            }
        })
        request.open('GET', this.templatesDir + '/' + template + '.html');
        request.send()
    },

    _parseTemplate: function (templateData) {
        templateData = templateData.replace('template>', 'div>')

        const templateEl = document.createElement('div')
        templateEl.innerHTML = templateData
        return templateEl.querySelector('div')
    },

    _setTemplate: function (el) {

        if (this.scrollTop) {
            window.scrollTo({top: 0})
        }

        this._clearNode(this.contentEl)
        this.contentEl.appendChild(el)
    },

    _clearNode: function (node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
    },

    _dispatchLoadedEvent: function () {
        let currentTemplate = this.currentTemplate
        let me = this

        const event = document.createEvent('CustomEvent')
        event.initCustomEvent('templateLoaded', false, false, {
            template: currentTemplate,
            source: me
        })

        dispatchEvent(event)
    },

    _setTitle: function () {
        if (this.updateTitle) {
            document.title = this.titleBase + ' | ' + this.currentTemplate
        }
    }
}