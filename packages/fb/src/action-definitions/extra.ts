import { reduxActions } from "@/redux/reducers";
import { selectCurrentFolder } from "@/redux/selectors";
import { thunkRequestFileAction } from "@/redux/thunks/dispatchers.thunks";
import { FbIconName } from "@/util/enums";
import { defineFileAction } from "@/util/helpers";
import { EssentialActions } from "./essential";

export const ExtraActions = {
  /**
   * Action that adds a button to create a new folder.
   */
  CreateFolder: defineFileAction({
    id: "create_folder",
    button: {
      name: "新しいフォルダー",
      toolbar: true,
      tooltip: "新しいフォルダー",
      icon: FbIconName.folderCreate,
      group: "Add",
    },
  } as const),
  /**
   * Action that adds a button to upload files.
   */
  UploadFiles: defineFileAction({
    id: "upload_files",
    button: {
      name: "ファイルをアップロード",
      toolbar: true,
      tooltip: "ファイルをアップロード",
      icon: FbIconName.upload,
      group: "Add",
    },
  } as const),
  /**
   * Action that adds a button to download files.
   */
  DownloadFiles: defineFileAction({
    id: "download_files",
    requiresSelection: true,
    fileFilter: (file) => !file?.isDir,
    button: {
      name: "ダウンロード",
      toolbar: true,
      contextMenu: true,
      icon: FbIconName.download,
      iconOnly: true,
    },
    breakPointsOverrides: {
      sm: {
        group: "Actions",
      },
      xs: {
        group: "Actions",
      },
    },
  } as const),
  /**
   * Action that adds a button and shortcut to delete files.
   */
  DeleteFiles: defineFileAction({
    id: "delete_files",
    requiresSelection: true,
    hotkeys: ["delete"],
    button: {
      name: "削除",
      toolbar: true,
      contextMenu: true,
      iconOnly: true,
      icon: FbIconName.trash,
    },
    breakPointsOverrides: {
      sm: {
        group: "Actions",
      },
      xs: {
        group: "Actions",
      },
    },
  } as const),
  /**
   * Action that adds a button to paste files.
   */
  PasteFiles: defineFileAction(
    {
      id: "paste_files",
      hotkeys: ["ctrl+v"],
      button: {
        name: "貼り付け",
        contextMenu: true,
        icon: FbIconName.paste,
        toolbar: true,
        iconOnly: true,
      },
    } as const,
    ({ getReduxState, reduxDispatch }) => {
      const state = getReduxState();
      if (state.cutState.files.length == 0) return undefined;
      const target = selectCurrentFolder(state);
      if (target?.id === state.cutState.source?.id) return undefined;
      reduxDispatch(
        thunkRequestFileAction(EssentialActions.MoveFiles, {
          source: state.cutState?.source!,
          target: selectCurrentFolder(state)!,
          files: state.cutState?.files!,
        }),
      );
      reduxDispatch(
        reduxActions.setCutState({
          files: [],
        }),
      );
      return undefined;
    },
  ),

  CutFiles: defineFileAction(
    {
      id: "cut_files",
      requiresSelection: true,
      hotkeys: ["ctrl+x"],
      button: {
        name: "切り取り",
        contextMenu: true,
        icon: FbIconName.cut,
        toolbar: true,
        iconOnly: true,
      },
      breakPointsOverrides: {
        sm: {
          group: "Actions",
        },
        xs: {
          group: "Actions",
        },
      },
    } as const,
    ({ state, reduxDispatch, getReduxState }) => {
      const curentFolder = selectCurrentFolder(getReduxState());
      reduxDispatch(
        reduxActions.setCutState({
          files: state.selectedFilesForAction,
          source: curentFolder!,
        }),
      );
      return undefined;
    },
  ),

  RenameFile: defineFileAction({
    id: "rename_file",
    requiresSelection: true,
    hotkeys: ["f2"],
    button: {
      name: "名前の変更",
      contextMenu: true,
      toolbar: true,
      iconOnly: true,
      icon: FbIconName.rename,
    },
    breakPointsOverrides: {
      sm: {
        group: "Actions",
      },
      xs: {
        group: "Actions",
      },
    },
  } as const),
};
