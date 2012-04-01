public class BvhBone {
    private String _name;
  
    public PVector absPos = new PVector();
    public PVector absEndPos = new PVector();
  
    private float _offsetX = 0;
    private float _offsetY = 0;
    private float _offsetZ = 0;
  
    private int _nbChannels;
    private List<String> _channels;
  
    private float _endOffsetX = 0;
    private float _endOffsetY = 0;
    private float _endOffsetZ = 0;
  
    private BvhBone _parent;
    private List<BvhBone> _children;
  
    private float _Xposition = 0;
    private float _Yposition = 0;
    private float _Zposition = 0;
    private float _Xrotation = 0;
    private float _Yrotation = 0;
    private float _Zrotation = 0;
  
    public PMatrix3D global_matrix;
  
    public BvhBone(BvhBone __parent) {
        _parent = __parent;
        _channels = new ArrayList<String>();
        _children = new ArrayList<BvhBone>();
    }
  
    public BvhBone() {
        _parent = null;
        _channels = new ArrayList<String>();
        _children = new ArrayList<BvhBone>();
    }
  
    public String toString() {
        return "[BvhBone] " + _name;
    }
  
    public String structureToString() {
        return structureToString(0);
    }
  
    public String structureToString(int __indent) {
        String res = "";
        for (int i = 0; i < __indent; i++)
            res += "=";
    
        res = res + "> " + _name + "  " + _offsetX + " " + _offsetY+ " " + _offsetZ + "\n";
        for (BvhBone child : _children)
            res += child.structureToString(__indent+1);
    
        return res;
    }
  
    public String getName() {
        return _name;
    }
  
    public void setName(String value) {
        _name = value;
    }
  
    public Boolean isRoot() {
        return (_parent == null);
    }
  
    public Boolean hasChildren() {
        return _children.size() > 0;
    }
  
    public List<BvhBone> getChildren() {
        return _children;
    }
  
    public void setChildren(List<BvhBone> value) {
        _children = value;
    }
  
    public BvhBone getParent() {
        return _parent;
    }
  
    public void setParent(BvhBone value) {
        _parent = value;
    }
  
    public List<String> getChannels() {
        return _channels;
    }
  
    public void setChannels(List<String> value) {
        _channels = value;
    }
  
    public int getNbChannels() {
        return _nbChannels;
    }
  
    public void setnbChannels(int value) {
        _nbChannels = value;
    }
  
    //------ position
  
    public float getZrotation() {
        return _Zrotation;
    }
  
    public void setZrotation(float value) {
        _Zrotation = value;
    }
  
    public float getYrotation() {
        return _Yrotation;
    }
  
    public void setYrotation(float value) {
        _Yrotation = value;
    }
  
    public float getXrotation() {
        return _Xrotation;
    }
  
    public void setXrotation(float value) {
        _Xrotation = value;
    }
  
    public float getZposition() {
        return _Zposition;
    }
  
    public void setZposition(float value) {
        _Zposition = value;
    }
  
    public float getYposition() {
        return _Yposition;
    }
  
    public void setYposition(float value) {
        _Yposition = value;
    }
  
    public float getXposition() {
        return _Xposition;
    }
  
    public void setXposition(float value) {
        _Xposition = value;
    }
  
    public float getEndOffsetZ() {
        return _endOffsetZ;
    }

    public void setEndOffsetZ(float value) {
        _endOffsetZ = value;
    }
  
    public float getEndOffsetY() {
        return _endOffsetY;
    }
  
    public void setEndOffsetY(float value) {
        _endOffsetY = value;
    }
  
    public float getEndOffsetX() {
        return _endOffsetX;
    }
  
    public void setEndOffsetX(float value) {
        _endOffsetX = value;
    }
  
    public float getOffsetZ() {
        return _offsetZ;
    }
  
    public void setOffsetZ(float value) {
        _offsetZ = value;
    }
  
    public float getOffsetY() {
        return _offsetY;
    }
  
    public void setOffsetY(float value) {
        _offsetY = value;
    }
  
    public float getOffsetX() {
        return _offsetX;
    }
  
    public void setOffsetX(float value) {
        _offsetX = value;
    }

    public void setAbsPosition(PVector pos) {
        absPos = pos;
    }  
  
    public PVector getAbsPosition() {
        return absPos;
    }
  

    public void setAbsEndPosition(PVector pos) {
        absEndPos = pos;
    }
  
    public PVector getAbsEndPosition() {
        return absEndPos;
    }
}

public class BvhParser {

    private Boolean _motionLoop;
    private int _currentFrame = 0;
    private String _src;
    private List<BvhLine> _lines;
    private int _currentLine;
    private BvhBone _currentBone;
    private BvhBone _rootBone;
    private List<List<Float>> _frames;
    private int _nbFrames;
    private float _frameTime;
    private List<BvhBone> _bones;
  
    public BvhParser() {
        _motionLoop = true;
    }
   
    /**
     * if set to True motion will loop at end
     */
    public Boolean getMotionLoop() {
        return _motionLoop;
    }
  
    public void setMotionLoop(Boolean value) {
        _motionLoop = value;
    }

    public String toStr() {
        return _rootBone.structureToString();
    }
  
    public int getNbFrames() {
        return _nbFrames;
    }

    public List<BvhBone> getBones() {
        return _bones;
    }

    /**
     * Parse the bvh file string
     * then call the gotoFrame method
     */
    public void init() {
        _bones = new ArrayList<BvhBone>();
        _motionLoop = true;
    }
  
    /**
     * go to the frame at __index, update the bones position and rotation
     */
    public void moveFrameTo(int __index) {
        if(!_motionLoop) {
            if(__index >= _nbFrames) {
                _currentFrame = _nbFrames-1;//last frame
            }
        }
        else {
            while (__index >= _nbFrames) {
                __index -= _nbFrames;
            } 
            _currentFrame = __index; //looped frame
        }
        _updateFrame();
    }

    public void moveMsTo(int mills, int loopSec) {
        float frameTime = _frameTime * 1000;
        int curFrame = (int)(mills / frameTime) % loopSec; 
        moveFrameTo(curFrame);
    }

    private void _updateFrame() {
        List<Float> frame = _frames.get(_currentFrame);

        int count = 0;
        for (float n : frame) {
            BvhBone bone = _getBoneInFrameAt(count);
            String prop = _getBonePropInFrameAt(count);
            if(bone != null) {
                Method getterMethod;
                try {
                    bone['set' + prop](n);
                } catch (e) {
                    println(e);
                }
            }
            count++;
        }      
    }    
  
    private String _getBonePropInFrameAt(int n) {
        int c = 0;      
        for (BvhBone bone : _bones) {
            if (c + bone.getNbChannels() > n) {
                n -= c;
                return bone.getChannels().get(n);
            }
            else {
                c += bone.getNbChannels();  
            }
        }
        return null;
    }
  
    private BvhBone _getBoneInFrameAt(int n) {
        int c = 0;      
        for (BvhBone bone : _bones) {
            c += bone.getNbChannels();
            if (c > n) {
                return bone;
            }
        }
        return null;
    }    
  
    public void parse(String[] srces) {
        String[] linesStr = srces;
        _lines = new ArrayList<BvhLine>();

        for ( String lineStr : linesStr) {
            _lines.add(new BvhLine(lineStr));
        }

        _currentLine = 1;
        _rootBone = _parseBone();
    
        _parseFrames();
    }    
  
    private void _parseFrames() {
        int currentLine = _currentLine;
        for (; currentLine < _lines.size(); currentLine++) {
            if (_lines.get(currentLine).getLineType() == BvhLine.MOTION) {
                break;
            }
        }

        if (_lines.size() > currentLine) {
            currentLine++; //Frames
            _nbFrames = _lines.get(currentLine).getNbFrames();
            currentLine++; //FrameTime
            _frameTime = _lines.get(currentLine).getFrameTime();
            currentLine++;

            _frames = new ArrayList<List<Float>>();
            for (; currentLine < _lines.size(); currentLine++) {
                _frames.add(_lines.get(currentLine).getFrames());
            }
        }
    }
  
    private BvhBone _parseBone() {
        //_currentBone is Parent
        BvhBone bone = new BvhBone( _currentBone);
    
        _bones.add(bone);
    
        bone.setName(_lines.get(_currentLine)._boneName); //1
    
        // +2 OFFSET
        _currentLine++; // 2 {
        _currentLine++; // 3 OFFSET
        bone.setOffsetX(_lines.get(_currentLine).getOffsetX());
        bone.setOffsetY(_lines.get(_currentLine).getOffsetY());
        bone.setOffsetZ(_lines.get(_currentLine).getOffsetZ());
      
        // +3 CHANNELS
        _currentLine++;
        bone.setnbChannels(_lines.get(_currentLine).getNbChannels());
        bone.setChannels(_lines.get(_currentLine).getChannelsProps());
      
        // +4 JOINT or End Site or }
        _currentLine++;
        while(_currentLine < _lines.size()) {
            String lineType = _lines.get(_currentLine).getLineType();
            //JOINT or ROOT
            if (BvhLine.BONE.equals(lineType)) {
                BvhBone child = _parseBone(); //generate new BvhBONE
                child.setParent(bone);
                bone.getChildren().add(child);
            }
            else if (BvhLine.END_SITE.equals(lineType)) {
                _currentLine++; // {
                _currentLine++; // OFFSET
                bone.setEndOffsetX(_lines.get(_currentLine).getOffsetX());
                bone.setEndOffsetY(_lines.get(_currentLine).getOffsetY());
                bone.setEndOffsetZ(_lines.get(_currentLine).getOffsetZ());
                _currentLine++; //}
                _currentLine++; //}
                return bone;
            } 
            else if (BvhLine.BRACE_CLOSED.equals(lineType)) {
                return bone; //}
            }
            _currentLine++;
        }
        return bone;  
    }    
  
    private class BvhLine {
  
        public static final String HIERARCHY = "HIERARCHY";
        public static final String BONE = "BONE";
        public static final String BRACE_OPEN = "BRACE_OPEN";
        public static final String BRACE_CLOSED = "BRACE_CLOSED";
        public static final String OFFSET = "OFFSET";
        public static final String CHANNELS = "CHANNELS";
        public static final String END_SITE = "END_SITE";
    
        public static final String MOTION = "MOTION";
        public static final String FRAMES = "FRAMES";
        public static final String FRAME_TIME = "FRAME_TIME";
        public static final String FRAME = "FRAME";
    
        public static final String BONE_TYPE_ROOT = "ROOT";
        public static final String BONE_TYPE_JOINT = "JOINT";
    
        public static final String PROP_X_POS = "Xposition";
        public static final String PROP_Y_POS = "Yposition";
        public static final String PROP_Z_POS = "Zposition";
        public static final String PROP_X_ROTATION = "Xrotation";
        public static final String PROP_Y_ROTATION = "Yrotation";
        public static final String PROP_Z_ROTATION = "Zrotation";
    
        private String _lineStr;
    
        private String _lineType;
        private String _boneType;
    
        private String _boneName;
        private float _offsetX;
        private float _offsetY;
        private float _offsetZ;
        private int _nbChannels;
        private List<String> _channelsProps;
        private int _nbFrames;
        private float _frameTime;
        private List<Float> _frames;
    
        public String toString() {
            return _lineStr;
        }
    
        private void _parse(String __lineStr) {
            _lineStr = __lineStr;
            _lineStr = _lineStr.trim();
            _lineStr = _lineStr.replace("\t", "");
            _lineStr = _lineStr.replace("\n", "");
            _lineStr = _lineStr.replace("\r", "");  
      
            String[] words = _lineStr.split(" ");
    
            _lineType = _parseLineType(words);
            if (! _lineType) {
                return;
            }
            if (HIERARCHY.equals(_lineType)) {
                return;
            } else if (BONE.equals(_lineType)) {
                _boneType = (words[0] == "ROOT") ? BONE_TYPE_ROOT : BONE_TYPE_JOINT;
                _boneName = words[1];
                return;
            } else if (OFFSET.equals(_lineType)) {
                _offsetX = words[1];
                _offsetY = words[2];
                _offsetZ = words[3];
                return;
            } else if (CHANNELS.equals(_lineType)) {
                _nbChannels = Number(words[1]);
                _channelsProps = new ArrayList<String>();
                for (int i = 0; i < _nbChannels; i++) {
                    _channelsProps.add(words[i+2]);
                }
                return;
            } else if (FRAMES.equals(_lineType)) {
                _nbFrames = words[1];
                return;
            } else if (FRAME_TIME.equals(_lineType)) {
                _frameTime = words[2];
                return;
            } else if (FRAME.equals(_lineType)) {
                _frames = new ArrayList<Float>();
                for (String word : words) {
                    _frames.add(word);
                }
                return;
            } else if (END_SITE.equals(_lineType)     ||
                       BRACE_OPEN.equals(_lineType)   ||
                       BRACE_CLOSED.equals(_lineType) ||
                       MOTION.equals(_lineType)) {
                return;
            }
        }  
    
        private String _parseLineType(String[] __words) {
            if ("HIERARCHY".equals(__words[0])) {
                return HIERARCHY;
            }
            if ("ROOT".equals(__words[0]) ||
                "JOINT".equals(__words[0])) {
                return BONE;
            }
            if ("{".equals(__words[0])) {
                return BRACE_OPEN;
            }
            if ("}".equals(__words[0])) {
                return BRACE_CLOSED;
            }
            if ("OFFSET".equals(__words[0])) {
                return OFFSET;
            }
            if ("CHANNELS".equals(__words[0])) {
                return CHANNELS;
            }
            if ("End".equals(__words[0])) {
                return END_SITE;
            }
            if ("MOTION".equals(__words[0])) {
                return MOTION;
            }
            if ("Frames:".equals(__words[0])) {
                return FRAMES;
            }
            if ("Frame".equals(__words[0])) {
                return FRAME_TIME;
            }
            if (Number(__words[0]) == __words[0]) {
                return FRAME;
            }

            return null;
        }
    
        public BvhLine(String __lineStr) {
            _parse(__lineStr);
        }
    
        public List<Float> getFrames() {
            return _frames;
        }
    
        public float getFrameTime() {
            return _frameTime;
        }
    
        public int getNbFrames() {
            return _nbFrames;
        }
    
        public List<String> getChannelsProps() {
            return _channelsProps;
        }
    
        public int getNbChannels() {
            return _nbChannels;
        }
    
        public float getOffsetZ() {
            return _offsetZ;
        }
    
        public float getOffsetY() {
            return _offsetY;
        }
    
        public float getOffsetX() {
            return _offsetX;
        }
    
        public String getBoneName() {
            return _boneName;
        }
    
        public String getBoneType() {
            return _boneType;
        }
    
        public String getLineType() {
            return _lineType;
        }
    }
}

public class PBvh {
    public BvhParser parser;
  
    public PBvh(String[] data) {
        parser = new BvhParser();
        parser.init();
        parser.parse(data);
    }
  
    public void draw(int ms) {
        parser.moveMsTo(ms, 3000);//30-sec loop 

        BvhBone root = parser.getBones().get(0);

        update(root);
        draw();
    }

    protected void update(BvhBone bone) {
        float DEG_TO_RAD = Math.PI / 180.0;
        pushMatrix();

        PMatrix3D m = new PMatrix3D();

        m.translate(bone.getXposition(), bone.getYposition(), bone.getZposition());
        m.translate(bone.getOffsetX(), bone.getOffsetY(), bone.getOffsetZ());
    
        m.rotateY(DEG_TO_RAD * bone.getYrotation());
        m.rotateX(DEG_TO_RAD * bone.getXrotation());
        m.rotateZ(DEG_TO_RAD * bone.getZrotation());
    
        bone.global_matrix = m;
        applyMatrix(m);

        if (bone.getParent() != null && bone.getParent().global_matrix != null) {
            m.preApply(bone.getParent().global_matrix);
        }
        m.mult(new PVector(), bone.getAbsPosition());
    
        if (bone.getChildren().size() > 0) {
            for (BvhBone child : bone.getChildren()) {
                update(child);
            }
        }
        else {
            translate(bone.getEndOffsetX(), bone.getEndOffsetY(), bone.getEndOffsetZ());
            m.translate(bone.getEndOffsetX(), bone.getEndOffsetY(), bone.getEndOffsetZ());
            m.mult(new PVector(), bone.getAbsEndPosition());
        }

        popMatrix();
    }
  
    protected void draw() {
        fill(color(255));
    
        for(BvhBone b : parser.getBones()) {
            pushMatrix();
            translate( b.absPos.x, b.absPos.y, b.absPos.z);
            sphere(2);
            popMatrix();
            if (!b.hasChildren()) {
                pushMatrix();
                translate( b.absEndPos.x, b.absEndPos.y, b.absEndPos.z);
                sphere(2);
                popMatrix();
            }
        }
    }
}

PBvh bvh_a, bvh_k, bvh_n;
public void setup() {
    size(1280, 720, P3D);
    noStroke();
    frameRate(30);
  
    bvh_a = new PBvh(loadStrings("/data/perfume/a.bvh"));
    bvh_k = new PBvh(loadStrings("/data/perfume/k.bvh"));
    bvh_n = new PBvh(loadStrings("/data/perfume/n.bvh"));
}

public void draw() {
    int ms = millis();
    background(0);
    camera((float) mouseX, (float) mouseY, 100.f, (float) (width/2.f), (float) (height/2.f), 0.f, 0.f, 1.f, 0.f);

    pushMatrix();
    translate(width/2, height/2 + 100, 0);
    scale(-1, -1, -1);
    bvh_a.draw(ms);
    bvh_k.draw(ms);
    bvh_n.draw(ms);
    popMatrix();
}
