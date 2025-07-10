import { reduxActions } from "@/redux/reducers";
import {
  getFileData,
  getIsFileSelected,
  selectDisableSelection,
  selectors,
  selectParentFolder,
} from "@/redux/selectors";
import { reduxThunks } from "@/redux/thunks";
import { thunkRequestFileAction } from "@/redux/thunks/dispatchers.thunks";
import type {
  ChangeSelectionPayload,
  MoveFilesPayload,
  OpenFileContextMenuPayload,
  OpenFilesPayload,
  MouseClickFilePayload,
} from "@/types/action-payloads.types";
import { FileHelper } from "@/util/file-helper";
import { defineFileAction } from "@/util/helpers";
import { Logger } from "@/util/logger";
import { FbActions } from "./index";
import { FbIconName } from "@/util/enums";

export const EssentialActions = {
  /**
   * Action that is dispatched when the user clicks on a file entry using their mouse.
   * Both single clicks and double clicks trigger this action.
   */
  MouseClickFile: defineFileAction(
    {
      id: "mouse_click_file",
      __payloadType: {} as MouseClickFilePayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      if (payload.clickType === "double") {
        if (FileHelper.isOpenable(payload.file)) {
          reduxDispatch(
            thunkRequestFileAction(FbActions.OpenFiles, {
              targetFile: payload.file,
              files: [payload.file],
            }),
          );
        }
      } else {
        // We're dealing with a single click

        const state = getReduxState();
        const disableSelection = selectDisableSelection(state);
        if (FileHelper.isSelectable(payload.file) && !disableSelection) {
          if (payload.ctrlKey || state.selectionMode) {
            // Multiple selection
            reduxDispatch(
              reduxActions.toggleSelection({
                fileId: payload.file.id,
                exclusive: false,
              }),
            );
            reduxDispatch(
              reduxActions.setLastClickIndex({
                index: payload.fileDisplayIndex,
                fileId: payload.file.id,
              }),
            );
          } else if (payload.shiftKey) {
            // Range selection
            const lastClickIndex = selectors.getLastClickIndex(getReduxState());
            if (typeof lastClickIndex === "number") {
              // We have the index of the previous click
              let rangeStart = lastClickIndex;
              let rangeEnd = payload.fileDisplayIndex;
              if (rangeStart > rangeEnd) {
                [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
              }

              reduxDispatch(reduxThunks.selectRange({ rangeStart, rangeEnd }));
            } else {
              // Since we can't do a range selection, do a
              // multiple selection
              reduxDispatch(
                reduxActions.toggleSelection({
                  fileId: payload.file.id,
                  exclusive: false,
                }),
              );
              reduxDispatch(
                reduxActions.setLastClickIndex({
                  index: payload.fileDisplayIndex,
                  fileId: payload.file.id,
                }),
              );
            }
          } else {
            // Exclusive selection
            reduxDispatch(
              reduxActions.toggleSelection({
                fileId: payload.file.id,
                exclusive: true,
              }),
            );
            reduxDispatch(
              reduxActions.setLastClickIndex({
                index: payload.fileDisplayIndex,
                fileId: payload.file.id,
              }),
            );
          }
        } else {
          if (!payload.ctrlKey && !disableSelection) {
            reduxDispatch(reduxActions.clearSelection());
          }
          reduxDispatch(
            reduxActions.setLastClickIndex({
              index: payload.fileDisplayIndex,
              fileId: payload.file.id,
            }),
          );
        }
      }
    },
  ),
  /**
   * Action that is dispatched when user moves files from one folder to another,
   * usually by dragging & dropping some files into the folder.
   */
  MoveFiles: defineFileAction({
    id: "move_files",
    __payloadType: {} as MoveFilesPayload,
  } as const),
  /**
   * Action that is dispatched when the selection changes for any reason.
   */
  ChangeSelection: defineFileAction({
    id: "change_selection",
    __payloadType: {} as ChangeSelectionPayload,
  } as const),
  /**
   * Action that is dispatched when user wants to open some files. This action is
   * often triggered by other actions.
   */
  OpenFiles: defineFileAction({
    id: "open_files",
    __payloadType: {} as OpenFilesPayload,
  } as const),
  /**
   * Action that is triggered when user wants to go up a directory.
   */
  OpenParentFolder: defineFileAction(
    {
      id: "open_parent_folder",
      hotkeys: ["backspace"],
      button: {
        name: "親ディレクトリへ移動",
        toolbar: true,
        contextMenu: false,
        icon: FbIconName.openParentFolder,
        iconOnly: true,
      },
    } as const,
    ({ reduxDispatch, getReduxState }) => {
      const reduxState = getReduxState();
      const parentFolder = selectParentFolder(reduxState);
      if (FileHelper.isOpenable(parentFolder)) {
        reduxDispatch(
          thunkRequestFileAction(FbActions.OpenFiles, {
            targetFile: parentFolder,
            files: [parentFolder],
          }),
        );
      } else if (!reduxState.forceEnableOpenParent) {
        Logger.warn(
          "Open parent folder effect was triggered even though the parent folder" +
            " is not openable. This indicates a bug in presentation components.",
        );
      }
    },
  ),
  /**
   * Action that is dispatched when user opens the context menu, either by right click
   * on something or using the context menu button on their keyboard.
   */
  OpenFileContextMenu: defineFileAction(
    {
      id: "open_file_context_menu",
      __payloadType: {} as OpenFileContextMenuPayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      // TODO: Check if the context menu component is actually enabled. There is a
      //  chance it doesn't matter if it is enabled or not - if it is not mounted,
      //  the action will simply have no effect. It also allows users to provide
      //  their own components - however, users could also flip the "context menu
      //  component mounted" switch...
      const triggerFile = getFileData(getReduxState(), payload.triggerFileId);
      if (triggerFile) {
        const fileSelected = getIsFileSelected(getReduxState(), triggerFile);
        if (!fileSelected) {
          // If file is selected, we leave the selection as is. If it is not
          // selected, it means user right clicked the file with no selection.
          // We simulate the Windows Explorer/Nautilus behaviour of moving
          // selection to this file.
          if (FileHelper.isSelectable(triggerFile)) {
            reduxDispatch(
              reduxActions.selectFiles({
                fileIds: [payload.triggerFileId],
                reset: true,
              }),
            );
          } else {
            reduxDispatch(reduxActions.clearSelection());
          }
        }
      }

      reduxDispatch(
        reduxActions.showContextMenu({
          triggerFileId: payload.triggerFileId,
          mouseX: payload.clientX - 2,
          mouseY: payload.clientY - 4,
        }),
      );
    },
  ),
};
