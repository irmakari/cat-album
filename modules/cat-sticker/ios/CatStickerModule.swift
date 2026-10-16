import CoreImage
import ExpoModulesCore
import Vision

// Lifts the cat out of a photo, the way a long press does in Photos, and
// keeps the result as a transparent PNG.
// What became of one photo. Only `none` is a lasting answer; a photo that
// could not be read or worked on is tried again next time.
private enum Outcome {
  case sticker(Data)
  case none
  case failed
}

// Above this share of the photo's pixels, the "subject" is the sofa or the
// whole scene rather than a cat. It is measured on the mask, not on the
// subject's bounding box: a cat photographed up close fills the frame's
// box easily, yet leaves the corners around its ears and paws empty.
private let maxCoverage: CGFloat = 0.92

// How sure Vision must be that an animal is a cat. Low on purpose: a missed
// cat costs the user a point, a dog taken for a cat costs nothing.
private let minCatConfidence: Float = 0.3

public class CatStickerModule: Module {
  private let context = CIContext()

  public func definition() -> ModuleDefinition {
    Name("CatSticker")

    // Resolves to the sticker's file URL, or nil when none can be made: an
    // older iOS, no clear subject, or a subject that is the whole picture.
    // Both outcomes are kept under `key`, so each photo is worked on once.
    AsyncFunction("stickerAsync") { (source: String, key: String, size: Double) -> String? in
      let (file, none) = try self.files(key)
      let manager = FileManager.default
      if manager.fileExists(atPath: file.path) { return file.absoluteString }
      if manager.fileExists(atPath: none.path) { return nil }

      switch self.makeSticker(source: source, size: CGFloat(size)) {
      case .sticker(let png):
        try png.write(to: file, options: .atomic)
        return file.absoluteString
      case .none:
        manager.createFile(atPath: none.path, contents: nil)
        return nil
      case .failed:
        return nil
      }
    }

    // Whether there is a cat in the photo: true or false, or nil where the
    // phone cannot tell (the Simulator, a photo that could not be read).
    // Only cats it saw count on the leaderboard.
    AsyncFunction("detectCatAsync") { (source: String) -> Bool? in
      #if targetEnvironment(simulator)
        return nil
      #else
        guard let url = URL(string: source),
          let data = try? Data(contentsOf: url),
          let image = CIImage(data: data, options: [.applyOrientationProperty: true])
        else { return nil }
        let request = VNRecognizeAnimalsRequest()
        guard (try? VNImageRequestHandler(ciImage: image).perform([request])) != nil else { return nil }
        return (request.results ?? []).contains { observation in
          observation.labels.contains {
            $0.identifier == VNAnimalIdentifier.cat.rawValue && $0.confidence >= minCatConfidence
          }
        }
      #endif
    }

    // Forgets a photo's sticker, for a cat that is deleted.
    Function("remove") { (key: String) in
      guard let files = try? self.files(key) else { return }
      try? FileManager.default.removeItem(at: files.0)
      try? FileManager.default.removeItem(at: files.1)
    }
  }

  private func makeSticker(source: String, size: CGFloat) -> Outcome {
    // Vision has no model to run in the Simulator and can hang there; this
    // says nothing about the photo, so it is not kept as an answer.
    #if targetEnvironment(simulator)
      return .failed
    #endif
    guard #available(iOS 17.0, *) else { return .none }
    // A photo that could not be read, or Vision refusing to run (as it does
    // in the Simulator), says nothing about the photo itself.
    guard let url = URL(string: source),
      let data = try? Data(contentsOf: url),
      let image = CIImage(data: data, options: [.applyOrientationProperty: true])
    else { return .failed }

    let handler = VNImageRequestHandler(ciImage: image)
    let request = VNGenerateForegroundInstanceMaskRequest()
    guard (try? handler.perform([request])) != nil else { return .failed }
    guard let observation = request.results?.first,
      let largest = Self.largestInstance(observation)
    else { return .none }
    if largest.coverage > maxCoverage { return .none }

    // Only the biggest subject: a cat held in someone's arms comes out
    // without the arms, and one of two cats does not drag the other along.
    guard let buffer = try? observation.generateMaskedImage(
      ofInstances: IndexSet(integer: largest.instance), from: handler, croppedToInstancesExtent: true)
    else { return .failed }

    var sticker = CIImage(cvPixelBuffer: buffer)
    let scale = min(1, size / max(sticker.extent.width, sticker.extent.height))
    if scale < 1 {
      sticker = sticker.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    }
    guard let space = CGColorSpace(name: CGColorSpace.sRGB),
      let png = context.pngRepresentation(of: sticker, format: .RGBA8, colorSpace: space)
    else { return .failed }
    return .sticker(png)
  }

  // The subject that covers the most of the photo, and the share it covers.
  // Each pixel of the instance mask holds the number of the subject it
  // belongs to, 0 for the background.
  @available(iOS 17.0, *)
  private static func largestInstance(_ observation: VNInstanceMaskObservation) -> (instance: Int, coverage: CGFloat)? {
    let mask = observation.instanceMask
    CVPixelBufferLockBaseAddress(mask, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(mask) else { return nil }
    let width = CVPixelBufferGetWidth(mask)
    let height = CVPixelBufferGetHeight(mask)
    let rowBytes = CVPixelBufferGetBytesPerRow(mask)

    var counts = [Int](repeating: 0, count: 256)
    for y in 0..<height {
      let row = base.advanced(by: y * rowBytes).assumingMemoryBound(to: UInt8.self)
      for x in 0..<width { counts[Int(row[x])] += 1 }
    }
    guard let best = observation.allInstances.max(by: { counts[$0] < counts[$1] }),
      counts[best] > 0, width * height > 0
    else { return nil }
    return (best, CGFloat(counts[best]) / CGFloat(width * height))
  }

  private func files(_ key: String) throws -> (URL, URL) {
    let caches = try FileManager.default.url(
      for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    let folder = caches.appendingPathComponent("cat-stickers", isDirectory: true)
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    let file = folder.appendingPathComponent(Self.fileName(key) + ".png")
    return (file, file.appendingPathExtension("none"))
  }

  // Keys reduced to something safe as a file name.
  private static func fileName(_ key: String) -> String {
    String(key.map { $0.isLetter || $0.isNumber ? $0 : "-" }.suffix(120))
  }
}
