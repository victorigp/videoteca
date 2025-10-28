# frozen_string_literal: true

require 'json'
require 'time'
require 'fileutils'

# Genera version.json en cada build con información del último commit
# - Publico:   <site>/version.json (para que el SW/cliente lo pueda leer)
# - Interno:   _data/version.json (por si se quiere usar en plantillas de Jekyll)
# Usa variables de entorno de Vercel si están disponibles, con fallback a `git`.
module VersionDataGenerator
  class Generator < Jekyll::Generator
    safe true
    priority :highest

    def generate(site)
      message = ENV['VERCEL_GIT_COMMIT_MESSAGE']
      sha     = ENV['VERCEL_GIT_COMMIT_SHA']

      begin
        message = `git log -1 --pretty=%B`.strip if (message.nil? || message.empty?)
      rescue StandardError
        # Ignorar si git no está disponible
      end

      begin
        sha = `git rev-parse HEAD`.strip if (sha.nil? || sha.empty?)
      rescue StandardError
        # Ignorar si git no está disponible
      end

      data = {
        'message' => message.to_s,
        'sha' => sha.to_s,
        'timestamp' => Time.now.utc.iso8601
      }

      # 1) Archivo público para el navegador
      public_file = File.join(site.dest, 'version.json')
      FileUtils.mkdir_p(File.dirname(public_file))
      File.write(public_file, JSON.pretty_generate(data))

      # 2) Archivo interno en _data por si se usa en layouts
      data_dir = File.join(site.source, '_data')
      FileUtils.mkdir_p(data_dir)
      File.write(File.join(data_dir, 'version.json'), JSON.pretty_generate(data))
    end
  end
end
''''''''''
