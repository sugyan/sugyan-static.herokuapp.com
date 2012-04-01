require 'sinatra'

get '/' do
  open('public/index.html').read
end

