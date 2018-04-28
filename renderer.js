// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const rd = require('rd')
const xlsx = require('xlsx')
const async = require('async');
const fs  = require('fs')
const {getCurrentWindow, globalShortcut} = require('electron').remote;
let ProgressBar = require('progressbar.js')
let  line = new ProgressBar.Line('#progress-bar',{
    fill: 'rgba(0, 0, 0, 0.1)',
    color:'rgba(144, 225, 36, 0.5)',
    // text:{style:{color:"#666"}}
});

let reload = ()=>{
    getCurrentWindow().reload()
}
const thread_max = 10

function errer(err) {
    console.error(err)
    throw new Error(err)


}

function getFileList() {
    let path =  getFilePath($('#file_list'),"文件列表")
    let file_list
    if (path.search(/\.xls(x?)$/) != -1) {
        //获取上传Excel文件的数据
        let workbook = xlsx.readFile(path);
        let sheet_name_list = workbook.SheetNames;
        let file_obj_list = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[1]], {range: -1});
        file_list = file_obj_list.map(item => {
            return item["__EMPTY"]
        })
    } else if(path.search(/\.txt$/) != -1){
        file_list = fs.readFileSync(path).toString().split('\r\n')
    } else {
        $(this).value("")
        errer("上传文件需为xlsx、txt格式,请重新上传")
    }
    return file_list
}

function getFilePath($d,log) {
    let path_val = $d.val();
    if(path_val){
        return $d[0].files[0].path
    }else {
        errer("请选择"+log)
    }
}



function getPath() {
    return [
        getFileList(),
        getFilePath($('#source_folder'), "查找的文件夹"),
        getFilePath($('#target_folder'), "文件移动的目标文件夹")
    ]
}
function getSourceFilelist(source_folder_path) {
    return new Promise((resolve, reject) => {
        rd.readFile(source_folder_path, function (err, files, s) {
            if (err) {
                reject(`    操作失败：${err}`)
            } else {
                console.log("   操作完成！")
                // files是一个数组，里面是目录/tmp目录下的所有文件（包括子目录）
                resolve(files)
            }

        });
    })
}

function compareFileList(file_list, source_file_list) {
    let same_files = []
    file_list.forEach(item => {
        source_file_list.forEach(source_file_path => {
            let reg = /[^\\]+(?=\.[^.]+$)/
            //获得不带后缀的文件名
            let source_file_name = source_file_path.match(reg)[0]
            if (item == source_file_name) {
                same_files.push(source_file_path)
            }
        })
    })
    if (same_files.length == 0) {
        alert('没有相同文件')
        throw new Error("没有相同文件")
    } else {
        console.log("   操作完成！")
        return same_files
    }
}

function moveFile(file_path_list, destpath, thread_max) {
    return new Promise((resolve, reject) => {

        let all = file_path_list.length;
        let count = 0;
        $('#progress-bar').progerees
        async.mapLimit(file_path_list, thread_max, (source_file, callback) => {
            let reg = /[\w\.]+(?!\\)$/
            let filename = source_file.match(reg)
            let readStream = fs.createReadStream(source_file);
            let writeStream = fs.createWriteStream(`${destpath}\\${filename}`)
            readStream.pipe(writeStream)
            readStream.on('end', () => {
                // line.animate(++count/all,{step:(state, circle, attachment)=>{
                //     circle.path.setAttribute('stroke', state.color);
                //     callback(null,1)
                // }},()=> {
                //
                // });
                line.set(++count/all)
                line.setText(`${count} / ${all}`)
                callback(null,1)

            })
            readStream.on('error', () => (
                callback(null,0)
            ))
        }, (err, result) => {
            if(err){
                reject(err)
            }else {
                $('title').html('完成！')
                setTimeout(reset,3000)
                resolve()
            }

        })
    })
}
function reset() {
    line.set(0)
    $('title').html('文件移动')
}
async function startTask() {
    try {
        //获取文件列表路径FileListPath、查找的文件夹路径SourceFolder、文件移动路径TargetFolder
        console.log("获取文件列表路径FL、查找的文件夹路径SourceFolder、文件移动路径TargetFolder...")
        let [file_list, source_folder_path, tartget_folder_path] = getPath()
        // 获取SourceFolder的文件路径列表SourceFL
        console.log("获取SourceFolder的文件路径列表SourceFL...")
        let source_file_list = await getSourceFilelist(source_folder_path)
        // let source_file_list = await getSourceFilelist("C:\\Users\\guozhenjiang\\Desktop\\test\\sourseFile")

        // 对比FL与SourceFL，生成同名文件路径列表SameFL
        console.log("对比FL与SourceFL，生成同名文件路径列表SameFL...")
        let same_file_list = compareFileList(file_list, source_file_list);

        //将SameFL中的文件转移到TargetFolder
        console.log("将SameFL中的文件转移到TargetFolder...")
        await moveFile(same_file_list, tartget_folder_path, thread_max)



    } catch (err) {
        alert(err)

        // reload();

    }
}

(function () {
    $('#startTask').click(startTask)

})()




