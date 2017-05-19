<template>
    <div v-bind:class="uploaderClass">
        <slot name="clip-uploader-action"
              :dragging="dragCounter > 0"></slot>
        <slot name="clip-uploader-body"
              :files="files"></slot>
        <div ref="clip-preview-template"
             class="clip-preview-template"
             style="display: none;">
            <div></div>
        </div>
    </div>
</template>

<style lang="scss">

</style>

<script>
import Uploader from '../classes/Uploader'
import File from '../classes/File'
import clone from 'lodash-es/clone'
import noop from 'lodash-es/noop'
import SymbolFallback from 'babel-runtime/core-js/symbol'

const fnProps = [
    'onAddedFile',
    'onRemovedFile',
    'onSending',
    'onDragEnter',
    'onDragLeave',
    'onDrop',
    'onTotalProgress',
    'onQueueComplete',
    'onMaxFiles',
    'onInit',
    'onComplete'
]
function defineFnPropReducer(memo, prop) {
    return Object.assign(memo, {
        [prop]: {
            type: Function,
            default: noop
        }
    })
}

export default {
    props: {
        uploaderClass: {
            type: String
        },
        options: {
            type: Object,
            default() {
                return {}
            }
        },
        ...fnProps.reduce(defineFnPropReducer, {})
    },

    data() {
        return {
            files: [],
            dragCounter: 0,
            uploader: null
        }
    },

    mounted() {
        const options = clone(this.options)
        const accept = options.accept || function (file, done) { done() }

        /**
         * Overriding properties of the options object
         */
        options.previewTemplate = this.$refs['clip-preview-template'].innerHTML
        options.accept = ({ blobId }, done) => {
            accept(this.getFile(blobId), done)
        }

        if (typeof (options.maxFiles) !== 'undefined' && options.maxFiles instanceof Object === true) {
            const { limit, message } = options.maxFiles
            options.maxFiles = limit
            options.dictMaxFilesExceeded = message
        }

        if (typeof (options.maxFilesize) !== 'undefined' && options.maxFilesize instanceof Object === true) {
            const { limit, message } = options.maxFilesize
            options.maxFilesize = limit
            options.dictFileTooBig = message
        }

        if (typeof options.acceptedFiles !== 'undefined' && options.acceptedFiles !== null) {
            switch (Object.prototype.toString.call(options.acceptedFiles)) {
                case '[object String]':
                    // already formatted for Dropzone
                    break
                case '[object Array]':
                    options.acceptedFiles = options.acceptedFiles.join(',')
                    break
                case '[object Object]':
                    const { extensions, message } = options.acceptedFiles
                    options.acceptedFiles = extensions.join(',')
                    options.dictInvalidFileType = this.cleanupMessage(message)
                    break
                default:
                    // improperly formatted, revert to Dropzone default value
                    options.acceptedFiles = null
            }

            /**
             * Instantiating uploader
             */
            this.uploader = new Uploader(options)
            this.bindEvents()
            this.uploader.mount(this.$el.firstElementChild)
            this.onInit(this)
        }
    },

    methods: {
        bindEvents() {
            this.uploader.on('addedfile', this.addedFile.bind(this))
            this.uploader.on('removedfile', this.removedFile.bind(this))
            this.uploader.on('sending', this.sending.bind(this))
            this.uploader.on('complete', this.complete.bind(this))
            this.uploader.on('error', this.error.bind(this))
            this.uploader.on('uploadprogress', this.uploadProgress.bind(this))
            this.uploader.on('thumbnail', this.thumbnail.bind(this))
            this.uploader.on('drop', this.drop.bind(this))
            this.uploader.on('dragenter', this.dragEnter.bind(this))
            this.uploader.on('dragleave', this.dragLeave.bind(this))
            this.uploader.on('totaluploadprogress', this.totalUploadProgress.bind(this))
            this.uploader.on('maxfilesexceeded', this.maxFilesExceeded.bind(this))
            this.uploader.on('queuecomplete', this.queueComplete.bind(this))
        },

        getFile(blobId) {
            let matchedFile = {}
            this.files.forEach((file) => {
                if (file._file.blobId === blobId) {
                    matchedFile = file
                }
            })
            return matchedFile
        },

        addedFile(file) {
            const fileId = SymbolFallback()
            file.blobId = fileId
            this.files.push(new File(file))
            this.onAddedFile(this.getFile(fileId))
        },

        removedFile({ blobId }) {
            const fileInstance = this.getFile(blobId)
            fileInstance.updateStatus('removed')
            this.onRemovedFile(fileInstance)
        },

        sending({ blobId }, xhr, formData) {
            const fileInstance = this.getFile(blobId)
            this.onSending(fileInstance, xhr, formData)
        },

        complete({ blobId, status, xhr = {} }) {
            const fileInstance = this.getFile(blobId)
            fileInstance.updateStatus(status)
            fileInstance.updateXhrResponse({
                response: xhr.response,
                responseText: xhr.responseText,
                statusCode: xhr.status
            })
            this.onComplete(fileInstance, status, xhr)
        },

        error({ blobId, status }, errorMessage) {
            const fileInstance = this.getFile(blobId)
            fileInstance.updateStatus(status)
            fileInstance.updateErrorMessage(errorMessage)
        },

        uploadProgress({ blobId }, progress, bytesSent) {
            const fileInstance = this.getFile(blobId)
            fileInstance.updateProgress(progress)
            fileInstance.updateBytesSent(bytesSent)
        },

        thumbnail({ blobId }, dataUrl) {
            const fileInstance = this.getFile(blobId)
            fileInstance.updateDataUrl(dataUrl)
        },

        drop() {
            this.dragCounter = 0
            this.onDrop()
            this.onDragLeave()
        },

        dragEnter(event) {
            event.preventDefault()
            this.dragCounter++
            this.onDragEnter()
        },

        dragLeave() {
            this.dragCounter--
            if (this.dragCounter === 0) {
                this.onDragLeave()
            }
        },

        totalUploadProgress() {
            this.onTotalProgress(...arguments)
        },

        queueComplete() {
            this.onQueueComplete()
        },

        maxFilesExceeded({ blobId }) {
            const fileInstance = this.getFile(blobId)
            this.onMaxFiles(fileInstance)
        },

        removeFile(file) {
            this.uploader.removeFile(file._file)
        },

        addFile(file) {
            this.uploader.addFile(file)
        },

        removeAllFiles(cancelQueued) {
            this.uploader.removeAllFiles(cancelQueued)
        }
    }
}
</script>
