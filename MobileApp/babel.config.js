module.exports = function(api){
    api.cache(true);
    return{
        presets: ['babel-preset-expo'],
        pluhins: [['module:react-native-dotenv']],
    };
};