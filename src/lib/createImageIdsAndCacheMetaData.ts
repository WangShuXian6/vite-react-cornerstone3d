import { api } from "dicomweb-client"
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader"

/**
 * 使用 dicomweb-client 获取一个研究的元数据，将其缓存到 cornerstone，
 * 并返回该研究中各帧的 imageIds 列表。
 *
 * 使用应用配置选择要获取的研究，以及从哪个 dicom-web 服务器获取。
 *
 * @returns {string[]} 一个包含该研究中实例 imageIds 的数组。
 */

export default async function createImageIdsAndCacheMetaData({
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID = null,
  wadoRsRoot,
  client = null,
}) {
  const SOP_INSTANCE_UID = "00080018"
  const SERIES_INSTANCE_UID = "0020000E"

  const studySearchOptions = {
    studyInstanceUID: StudyInstanceUID,
    seriesInstanceUID: SeriesInstanceUID,
  }

  client =
    client ||
    new api.DICOMwebClient({ url: wadoRsRoot as string, singlepart: true })
  const instances = await client.retrieveSeriesMetadata(studySearchOptions)
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

// 我们不想添加非 PET 数据
// 注：对于 99% 的扫描仪，SUV 计算在切片之间是一致的

  return imageIds
}
