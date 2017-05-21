<template>
    <div :class="uploaderClass">
        <slot name="clip-uploader-action"
              :dragging="isDragging"></slot>
        <slot name="clip-uploader-body"
              :files="files"></slot>
        <div ref="clip-preview-template"
             class="clip-preview-template"
             style="display: none;">
            <div></div>
        </div>
    </div>
</template>

<script>
import Uploader from '../classes/Uploader'
import DropzoneFile from '../classes/DropzoneFile'
import capitalize from 'lodash-es/capitalize'
import isString from 'lodash-es/isString'
import isObject from 'lodash-es/isObject'
import isArray from 'lodash-es/isArray'
import clone from 'lodash-es/clone'
import toString from 'lodash-es/toString'
import uniqueId from 'lodash-es/uniqueId'

const toEventName = n => n.split('-').join('')
const toCallbackName = n => 'on' + n.split('-').map((s, i) => capitalize(s)).join('')
const toEmitName = n => n

const dzEvents = {
    fileFirst: [
        'removed-file',
        'processing',
        'upload-progress',
        'sending',
        'success',
        'complete',
        'canceled',
        'max-files-reached',
        'max-files-exceeded',
    ],
    multipleFiles: [
        'processing-multiple',
        'sending-multiple',
        'success-multiple',
        'complete-multiple',
        'canceled-multiple',
    ],
    generic: [
        'drag-start',
        'drag-end',
        'drag-over',
        'total-upload-progress',
        'reset',
        'queue-complete',
    ],
    special: [
        'added-file',
        'thumbnail',
        'error',
        'drop',
        'drag-enter',
        'drag-leave',
    ],
}

export default {
    props: {
        uploaderClass: {
            type: String
        },
        options: {
            type: Object,
            default: () => new Object()
        },
    },

    computed: {
        isDragging() {
            return this.dragCounter > 0
        },
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

        options.previewTemplate = this.$refs['clip-preview-template'].innerHTML
        options.accept = (file, done) => accept(this.getFileById(file.id).set(file), done)

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
            switch (true) {
                case isString(options.acceptedFiles):
                    // already formatted for Dropzone
                    break
                case isArray(options.acceptedFiles):
                    options.acceptedFiles = options.acceptedFiles.join(',')
                    break
                default:
                    // improperly formatted, revert to Dropzone default value
                    options.acceptedFiles = null
            }
        }

        /**
         * Instantiating uploader
         */
        this.uploader = new Uploader(options)
        this.bindEventsToUploader()
        this.uploader.mount(this.$el.firstElementChild)
        this.$emit('init', this)
    },

    destroyed() {
        this.uploader.destroy()
    },

    methods: {
        bindEventsToUploader() {
            Object.keys(dzEvents).forEach(type => {
                dzEvents[type].forEach(e => {
                    this.uploader.on(toEventName(e), this[toCallbackName(e)])
                })
            })
        },

        getFileById(id) {
            return this.files.find(f => f.id === toString(id))
        },

        updateFile(file, ...data) {
            return this.getFileById(file.id).setDeepProps(file, ...data)
        },

        ...dzEvents.fileFirst.reduce((memo, event) => {
            return Object.assign(memo, {
                [toCallbackName(event)](file, ...args) {
                    this.$emit(toEmitName(event), this.updateFile(file), ...args)
                }
            })
        }, {}),

        ...dzEvents.multipleFiles.reduce((memo, event) => {
            return Object.assign(memo, {
                [toCallbackName(event)](fileList, ...args) {
                    const files = fileList.map(file => this.updateFile(file))
                    this.$emit(toEmitName(event), files, ...args)
                }
            })
        }, {}),

        ...dzEvents.generic.reduce((memo, event) => {
            return Object.assign(memo, {
                [toCallbackName(event)]() {
                    this.$emit(toEmitName(event), ...arguments)
                }
            })
        }, {}),

        onAddedFile(file, ...args) {
            file.id = uniqueId()
            const f = new DropzoneFile().setDeepProps(file)
            this.files.push(f)
            this.$emit('added-file', f, ...args)
        },

        onThumbnail(file, dataUrl) {
            this.$emit('thumbnail', this.updateFile(file, { dataUrl }), dataUrl)
        },

        onError(file, errorMessage) {
            this.$emit('error', this.updateFile(file, { errorMessage }), errorMessage)
        },

        onDrop() {
            this.dragCounter = 0
            this.$emit('drop', ...arguments)
        },

        onDragEnter(e) {
            e.preventDefault();
            this.dragCounter++;
            this.$emit('drag-enter', ...arguments)
        },

        onDragLeave() {
            this.dragCounter--
            this.$emit('drag-leave', ...arguments)
        },

        removeFile(file) {
            this.uploader.removeFile(file)
        },

        addFile(file) {
            this.uploader.addFile(file)
        },

        removeAllFiles(cancelQueued) {
            this.uploader.removeAllFiles(cancelQueued)
        },
    },
}
</script>
