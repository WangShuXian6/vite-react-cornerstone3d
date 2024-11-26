# React + Vite + Cornerstone3D
> 官方原仓库 https://github.com/cornerstonejs/vite-react-cornerstone3d

## src\lib\createImageIdsAndCacheMetaData.ts


这段代码的目的是使用 `dicomweb-client` 和 `cornerstonejs` 库来从 DICOM Web 服务器获取医学影像的元数据，缓存这些元数据到 `cornerstone`，并返回影像的 `imageIds` 列表。以下是详细解析：

### 引入模块
```javascript
import { api } from "dicomweb-client"
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader"
```
- `dicomweb-client` 是一个用于与 DICOM Web 服务器进行交互的库。通过它可以访问、下载、检索 DICOM 数据。
- `cornerstoneDICOMImageLoader` 是一个专门用来加载和处理 DICOM 图像的库，它支持 `cornerstone`（一个用于医学图像查看的框架）。该库可以将 DICOM 图像加载到浏览器中进行显示。

### 函数说明
```javascript
/**
 * 使用 dicomweb-client 获取一个研究的元数据，将其缓存到 cornerstone，
 * 并返回该研究中各帧的 imageIds 列表。
 *
 * 使用应用配置选择要获取的研究，以及从哪个 dicom-web 服务器获取。
 *
 * @returns {string[]} 一个包含该研究中实例 imageIds 的数组。
 */
```
- 这段注释简要说明了函数的功能：获取一个特定医学研究的元数据，缓存这些数据，并返回该研究中所有帧的 `imageIds` 列表。

### 函数定义
```javascript
export default async function createImageIdsAndCacheMetaData({
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID = null,
  wadoRsRoot,
  client = null,
}) {
```
- 该函数是异步的，接受一个对象作为参数，包含以下字段：
  - `StudyInstanceUID`: 研究实例的唯一标识符。
  - `SeriesInstanceUID`: 系列实例的唯一标识符。
  - `SOPInstanceUID`: 可选参数，表示单一 DICOM 实例的标识符。
  - `wadoRsRoot`: DICOM Web 服务器的根 URL。
  - `client`: 可选的 `dicomweb-client` 实例，如果没有传入，将会创建一个新的实例。

### 定义常量
```javascript
const SOP_INSTANCE_UID = "00080018"
const SERIES_INSTANCE_UID = "0020000E"
```
- 这些是 DICOM 元数据中用于标识 `SOPInstanceUID` 和 `SeriesInstanceUID` 的标准 DICOM 标签（标签是 DICOM 数据元素的标识符）。

### 创建 `studySearchOptions`
```javascript
const studySearchOptions = {
  studyInstanceUID: StudyInstanceUID,
  seriesInstanceUID: SeriesInstanceUID,
}
```
- 这段代码创建了一个包含 `StudyInstanceUID` 和 `SeriesInstanceUID` 的对象，这两个标识符将用于查询特定的 DICOM 系列数据。

### 创建 DICOM Web 客户端
```javascript
client =
  client ||
  new api.DICOMwebClient({ url: wadoRsRoot as string, singlepart: true })
```
- 如果传入了 `client` 参数，则使用该客户端，否则创建一个新的 `dicomweb-client` 客户端实例。该客户端将用于请求 DICOM 数据，`wadoRsRoot` 是 DICOM Web 服务器的根 URL。

### 获取元数据
```javascript
const instances = await client.retrieveSeriesMetadata(studySearchOptions)
```
- 通过调用 `retrieveSeriesMetadata` 方法，客户端从 DICOM Web 服务器获取指定研究和系列的元数据。`instances` 是一个包含元数据的数组。

### 处理每个实例的元数据并生成 `imageId`
```javascript
const imageIds = instances.map((instanceMetaData) => {
  const SeriesInstanceUID = instanceMetaData[SERIES_INSTANCE_UID].Value[0]
  const SOPInstanceUIDToUse =
    SOPInstanceUID || instanceMetaData[SOP_INSTANCE_UID].Value[0]

  const prefix = "wadors:"

  const imageId =
    prefix +
    wadoRsRoot +
    "/studies/" +
    StudyInstanceUID +
    "/series/" +
    SeriesInstanceUID +
    "/instances/" +
    SOPInstanceUIDToUse +
    "/frames/1"

  cornerstoneDICOMImageLoader.wadors.metaDataManager.add(
    imageId,
    instanceMetaData
  )
  return imageId
})
```
- 对于每个 DICOM 实例的元数据 (`instanceMetaData`)，从中提取 `SeriesInstanceUID` 和 `SOPInstanceUID`。如果函数参数中提供了 `SOPInstanceUID`，则优先使用它，否则使用元数据中的 `SOPInstanceUID`。
- 使用这些信息构建一个唯一的 `imageId`，格式为：`wadors:{wadoRsRoot}/studies/{StudyInstanceUID}/series/{SeriesInstanceUID}/instances/{SOPInstanceUID}/frames/1`，其中 `frames/1` 表示该帧的图像数据。
- 将生成的 `imageId` 与对应的元数据一起添加到 `cornerstoneDICOMImageLoader.wadors.metaDataManager`，这样可以将元数据缓存到 `cornerstone` 中，供后续的图像加载使用。
- 最终，`map` 方法返回包含所有 `imageIds` 的数组。

### 注释
```javascript
// 我们不想添加非 PET 数据
// 注：对于 99% 的扫描仪，SUV 计算在切片之间是一致的
```
- 这段注释指出，该代码并不处理非 PET 数据，并且对于 99% 的扫描仪，SUV（标准化摄取值）计算在不同切片之间是一致的。虽然这段注释未完全展开，可能与医学图像分析有关，尤其是 PET（正电子发射断层扫描）影像的标准化处理。

### 返回 `imageIds`
```javascript
return imageIds
```
- 最终，函数返回包含所有影像实例的 `imageIds` 数组。这些 `imageIds` 可以用来加载和显示图像。

### 总结
这段代码的目的是从指定的 DICOM Web 服务器获取指定研究和系列的元数据，将元数据缓存到 `cornerstone`，并生成一组 `imageIds`，这些 `imageIds` 可用于加载实际的医学影像。通过这样的方式，可以动态地从 DICOM Web 服务器获取影像数据并在医学影像查看器中显示。

## src\App.tsx

这段代码是一个 React 应用程序，旨在使用 `cornerstone.js`（一个用于医学图像查看的 JavaScript 库）加载 DICOM 图像并在浏览器中显示。代码中涉及了多个库的初始化和配置，主要目的是从 DICOM Web 服务器获取图像数据、设置 `cornerstone` 渲染引擎、并在特定的视图中显示图像。下面是对代码的详细解析：

### 引入模块
```javascript
import { useEffect, useRef } from "react"
import createImageIdsAndCacheMetaData from "./lib/createImageIdsAndCacheMetaData"
import { RenderingEngine, Enums, type Types, volumeLoader, cornerstoneStreamingImageVolumeLoader } from "@cornerstonejs/core"
import { init as csRenderInit } from "@cornerstonejs/core"
import { init as csToolsInit } from "@cornerstonejs/tools"
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader"
```
- `useEffect` 和 `useRef` 是 React 的两个钩子，分别用于副作用管理和创建引用。
- `createImageIdsAndCacheMetaData` 是一个自定义的函数，用于从 DICOM Web 服务器获取元数据并返回 `imageIds` 列表，之前在您的代码中已经看到过。
- `RenderingEngine`, `Enums`, `Types`, `volumeLoader` 等是 `cornerstone.js` 核心库的导入，用于图像渲染、视图管理和数据加载。
- `csRenderInit`，`csToolsInit` 和 `dicomImageLoaderInit` 是初始化函数，分别用于设置 `cornerstone` 渲染引擎、工具和 DICOM 图像加载器。

### 注册流式图像卷加载器
```javascript
volumeLoader.registerUnknownVolumeLoader(cornerstoneStreamingImageVolumeLoader)
```
- 通过这行代码，将 `cornerstoneStreamingImageVolumeLoader` 注册为一个流式加载器。该加载器支持逐帧加载大体积的医学图像数据，避免一次性加载所有图像占用大量内存。

### `App` 组件
```javascript
function App() {
  const elementRef = useRef<HTMLDivElement>(null)
  const running = useRef(false)
```
- `elementRef` 用于创建对 DOM 元素的引用，这个元素将在后续中用作图像渲染的容器。
- `running` 用于确保应用只初始化一次，避免重复加载和渲染。

### `useEffect` 初始化过程
```javascript
useEffect(() => {
  const setup = async () => {
    if (running.current) {
      return
    }
    running.current = true
```
- `useEffect` 用于在组件挂载时执行初始化操作，依赖项为空数组 `[]`，意味着它只会执行一次。
- `running.current` 用于防止函数多次执行，确保只初始化一次。

### 初始化 `cornerstone` 渲染引擎和工具
```javascript
await csRenderInit()
await csToolsInit()
dicomImageLoaderInit({ maxWebWorkers: 1 })
```
- `csRenderInit`：初始化 `cornerstone` 渲染引擎，用于图像的渲染和显示。
- `csToolsInit`：初始化 `cornerstone` 工具集，用于处理图像交互（如放大、缩小、旋转等）。
- `dicomImageLoaderInit`：初始化 DICOM 图像加载器，设置 `maxWebWorkers: 1` 限制最大并行 Web Worker 数量为 1，这样可以避免并发加载过多图像导致内存过大。

### 获取 `imageIds` 和元数据
```javascript
const imageIds = await createImageIdsAndCacheMetaData({
  StudyInstanceUID: "1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463",
  SeriesInstanceUID: "1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561",
  wadoRsRoot: "https://d3t6nz73ql33tx.cloudfront.net/dicomweb",
})
```
- `createImageIdsAndCacheMetaData` 函数被调用以获取 DICOM 图像的 `imageIds` 和元数据。提供的参数包括：
  - `StudyInstanceUID`：研究的唯一标识符。
  - `SeriesInstanceUID`：系列的唯一标识符。
  - `wadoRsRoot`：DICOM Web 服务器的 URL 根路径。

### 创建并配置渲染引擎
```javascript
const renderingEngineId = "myRenderingEngine"
const renderingEngine = new RenderingEngine(renderingEngineId)
const viewportId = "CT"

const viewportInput = {
  viewportId,
  type: Enums.ViewportType.ORTHOGRAPHIC,
  element: elementRef.current,
  defaultOptions: {
    orientation: Enums.OrientationAxis.SAGITTAL,
  },
}

renderingEngine.enableElement(viewportInput)
```
- `RenderingEngine` 是 `cornerstone.js` 中的一个核心组件，用于管理图像渲染。
- `viewportId` 是视口的标识符，在本例中为 `"CT"`。
- `viewportInput` 用于配置视口的属性，设置类型为正交视图 (`ORTHOGRAPHIC`)，并将视口的 DOM 元素指向 `elementRef.current`，即前面引用的 `div` 元素。
- `defaultOptions` 设置视口的默认方向为矢状面 (`SAGITTAL`)。
- `renderingEngine.enableElement` 启用渲染引擎，并将视口配置应用到目标 DOM 元素上。

### 获取视口并加载图像卷
```javascript
const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport
```
- 使用 `getViewport` 方法获取已创建的视口对象。

```javascript
const volumeId = "streamingImageVolume"
const volume = await volumeLoader.createAndCacheVolume(volumeId, {
  imageIds,
})
```
- `volumeId` 是加载的图像卷的标识符。
- `volumeLoader.createAndCacheVolume` 用于创建并缓存一个新的图像卷，传入的 `imageIds` 是之前从 DICOM Web 服务器获取的图像 ID。

### 加载图像数据并渲染
```javascript
volume.load()

viewport.setVolumes([{ volumeId }])
viewport.render()
```
- `volume.load()` 开始加载图像数据。
- `viewport.setVolumes` 将加载的图像卷绑定到视口中。
- `viewport.render()` 执行渲染，最终显示图像。

### 返回渲染元素
```javascript
return (
  <div
    ref={elementRef}
    style={{
      width: "512px",
      height: "512px",
      backgroundColor: "#000",
    }}
  ></div>
)
```
- 返回一个 `div` 元素，作为渲染容器，宽高为 512x512 像素，背景为黑色，`ref={elementRef}` 使得该 `div` 元素可以被 React 组件引用和操作。

### 总结
这段代码主要用于：
1. 初始化 `cornerstone.js` 渲染引擎、工具和 DICOM 图像加载器。
2. 从 DICOM Web 服务器获取图像元数据和 `imageIds`。
3. 创建一个 `RenderingEngine`，并将图像加载到视口中。
4. 在网页上渲染医学影像（CT 或其他类型的医学图像）。

通过这些步骤，代码实现了医学图像的显示和交互功能，用户可以在网页中查看加载的 DICOM 图像。