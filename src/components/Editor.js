import React, { useEffect, useState } from 'react'
import { ContentState, Editor as DraftEditor, EditorState, getDefaultKeyBinding, Modifier } from 'draft-js'
import CodeUtils from 'draft-js-code'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles({
    editor: props => ({
        width: props.width,
        minHeight: props.minHeight,
        margin: props.margin,
        padding: props.padding,
        border: props.border,
        background: props.background,
        overflow: props.overflow,
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: 1.3,
    }),
})

/**
 * @param {String} id
 * @param {NativeEditorProxy} nativeEditorProxy
 * @return {JSX.Element}
 */
export default function Editor({ id, nativeEditorProxy }) {
    const [editorState, setEditorState] = useState(EditorState.createEmpty())
    const classes = useStyles(nativeEditorProxy.getStyles())

    const onKeyUpWrapper = e => e.stopPropagation()
    const onPasteWrapper = e => e.stopPropagation()

    const handleKeyCommand = keyCommand => {
        if (keyCommand === 'backspace') {
            const newEditorState = CodeUtils.handleKeyCommand(editorState, keyCommand)
            if (newEditorState) {
                setEditorState(newEditorState)
                return 'handled'
            }
        }
        return 'not-handled'
    }

    const keyBindingFn = event => {
        if (event.key === 'Enter') {
            setEditorState(CodeUtils.handleReturn(event, editorState))
            return 'handled'
        }
        if (event.key === 'Tab') {
            setEditorState(CodeUtils.onTab(event, editorState))
            return 'handled'
        }
        return getDefaultKeyBinding(event)
    }

    const handleNativeEditorContentChange = event => {
        const newEditorState = EditorState.push(
            editorState,
            ContentState.createFromText(event.detail.newContent),
            'content-change-by-native-editor'
        )
        setEditorState(newEditorState)
    }

    const handleNativeEditorFileAttach = event => {
        const insertedText = event.detail.markdownLinks.join(' ')
        const fileAttachedContentState = Modifier.replaceText(
            editorState.getCurrentContent(),
            editorState.getSelection(),
            insertedText
        )
        const imageAddedEditorState = EditorState.push(
            editorState,
            fileAttachedContentState,
            'file-attach-by-native-editor'
        )
        const newEditorState = EditorState.forceSelection(
            imageAddedEditorState,
            fileAttachedContentState.getSelectionAfter()
        )
        setEditorState(newEditorState)
    }

    useEffect(() => {
        setEditorState(EditorState.createWithText(nativeEditorProxy.getContent()))
    }, [])

    useEffect(() => {
        nativeEditorProxy.updateContent(editorState.getCurrentContent().getPlainText())
    }, [editorState])

    useEffect(() => {
        nativeEditorProxy.addEventListener('content-change', handleNativeEditorContentChange)
        return () => {
            nativeEditorProxy.removeEventListener('content-change', handleNativeEditorContentChange)
        }
    })

    useEffect(() => {
        nativeEditorProxy.addEventListener('file-attach', handleNativeEditorFileAttach)
        return () => {
            nativeEditorProxy.removeEventListener('file-attach', handleNativeEditorFileAttach)
        }
    })

    return (
        <div id={id} className={classes.editor} onKeyUp={onKeyUpWrapper} onPaste={onPasteWrapper}>
            <DraftEditor
                editorState={editorState}
                onChange={setEditorState}
                handleKeyCommand={handleKeyCommand}
                keyBindingFn={keyBindingFn}
            />
        </div>
    )
}
