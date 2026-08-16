require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'GestureDetector'
  s.version        = package['version']
  s.summary        = package['description'] || 'Apple Vision hand gesture detection'
  s.description    = 'Native Expo module using Apple Vision framework to detect finger gun gestures'
  s.license        = 'MIT'
  s.author         = 'Finger Shoot'
  s.homepage       = 'https://github.com/eointolster/three-finger-shoot'
  s.platforms      = { :ios => '15.0' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.swift_version  = '5.0'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"

  s.frameworks = 'AVFoundation', 'Vision', 'UIKit'
end
